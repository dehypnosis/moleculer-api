import * as kleur from "kleur";
import { RecursivePartial } from "../interface";
import { Logger } from "../logger";
import { ContextBase } from "./context";
import { ServiceRegistry, ServiceRegistryOptions, Service, ServiceAction, ServiceNode } from "./registry";
import { Reporter, ReporterOptions } from "./reporter";
import { EventPubSub, EventPacket, DiscoveryPubSub, EventListener } from "./pubsub";
import { ParamsMapper, ParamsMapperProps } from "./params";
import { BatchingPoolMap, BatchingPoolOptions } from "./batching";
import { createInlineFunction, InlineFunctionOptions, InlineFunctionProps } from "./function";
import { ServiceBrokerDelegatorConstructors, ServiceBrokerDelegatorConstructorOptions, ServiceBrokerDelegator } from "./delegator";

export type ServiceBrokerOptions = {
  registry: ServiceRegistryOptions;
  batching: BatchingPoolOptions;
  function: InlineFunctionOptions;
  reporter: ReporterOptions;
} & ServiceBrokerDelegatorConstructorOptions;

export type ServiceBrokerProps = {
  logger: Logger;
};

export type ServiceBrokerListeners = {
  connected: (service: Readonly<Service>) => void;
  disconnected: (service: Readonly<Service>) => void;
  nodePoolUpdated: (service: Readonly<Service>) => void;
};

export type CallArgs = { action: Readonly<ServiceAction>, params: any, disableCache: boolean, batchingParams?: any };
export type EventPublishArgs = Omit<EventPacket, "from">;
export type DelegatedCallArgs = Omit<CallArgs, "batchingParams"> & { node: Readonly<ServiceNode> };
export type DelegatedEventPublishArgs = EventPublishArgs;

export class ServiceBroker<Context extends ContextBase = ContextBase> {
  private readonly delegator: ServiceBrokerDelegator<Context>;
  private readonly eventPubSub: EventPubSub;
  private readonly eventSubscriptionMap = new Map<any, Array<number | AsyncIterator<EventPacket>>>();
  private readonly discoveryPubSub: DiscoveryPubSub;
  private readonly batchingPoolMap: BatchingPoolMap<Context>;
  private readonly registry: ServiceRegistry;
  private readonly opts: RecursivePartial<ServiceBrokerOptions>;

  constructor(protected readonly props: ServiceBrokerProps, opts?: RecursivePartial<ServiceBrokerOptions>) {
    // save options
    this.opts = opts || {};

    // create delegator from options
    const delegatorKeys = Object.keys(ServiceBrokerDelegatorConstructors);
    let delegatorKey = delegatorKeys.find(type => !!this.opts[type as keyof ServiceBrokerDelegatorConstructorOptions]);
    if (!delegatorKey) {
      delegatorKey = delegatorKeys[0];
      this.props.logger.info(`available delegator options are not specified: use ${delegatorKey} delegator`);
    }
    const key = delegatorKey as keyof ServiceBrokerDelegatorConstructorOptions;
    this.delegator = new (ServiceBrokerDelegatorConstructors[key])({
      logger: this.props.logger.getChild(key),
      emitEvent: this.emitEvent.bind(this),
      emitServiceConnected: this.emitServiceConnected.bind(this),
      emitServiceDisconnected: this.emitServiceDisconnected.bind(this),
    }, this.opts[key] || {});

    // create event buses
    this.eventPubSub = new EventPubSub({
      onError: error => this.props.logger.error(error),
      eventNamePatternResolver: this.delegator.eventNameResolver,
      maxListeners: Infinity,
    });

    this.discoveryPubSub = new DiscoveryPubSub({
      onError: error => this.props.logger.error(error),
    });

    // create batching pools
    this.batchingPoolMap = new BatchingPoolMap<Context>(this.opts.batching);

    // create registry
    this.registry = new ServiceRegistry({
      logger: this.props.logger.getChild("registry"),
    }, this.opts.registry);
  }

  /* lifecycle */
  private working = false;

  public async start(listeners: ServiceBrokerListeners): Promise<void> {
    this.working = true;
    await this.discoveryPubSub.subscribeAll(listeners);
    await this.registry.start();
    await this.delegator.start();
    this.props.logger.info(`service broker has been started: ${kleur.yellow(this.delegator.key)}`);
  }

  public async stop(): Promise<void> {
    this.working = false;
    await this.registry.stop();
    this.discoveryPubSub.unsubscribeAll();
    this.eventPubSub.unsubscribeAll();
    this.eventSubscriptionMap.clear();
    this.batchingPoolMap.clear();
    await this.delegator.stop();
    this.props.logger.info(`service broker has been stopped`);
  }

  /*
    protected methods for brokering discovery and events by delegator
  */
  protected async emitEvent(packet: EventPacket): Promise<void> {
    if (!this.working) {
      return;
    }
    this.props.logger.info(`${kleur.green(packet.event)} event from ${kleur.yellow(packet.from ? `${packet.from.serviceId}:${packet.from.serviceHash}@${packet.from.nodeId}` : "unknown")} with ${Object.keys(packet.params || {}).join(", ") || "(empty)"} params`);
    await this.eventPubSub.publish(packet.event, packet);
    this.registry.addEventExample(this.resolveEventName(packet.event), packet);
  }

  protected async emitServiceConnected(service: Service): Promise<void> {
    if (!this.working) {
      return;
    }
    if (!(service instanceof Service) || !service.id) { // unrecognized service
      this.props.logger.error(`service broker discovered a unrecognized service: ${service}`);
      return;
    }
    const foundService = this.registry.findServiceByHash(service.hash);
    if (foundService) { // node pool updated
      for (const node of service.nodeIdMap.values()) {
        foundService.addNode(node);
      }
      await this.discoveryPubSub.publish("nodePoolUpdated", service);
    } else { // new service connected
      service.setBroker(this);
      this.registry.addService(service);
      await this.discoveryPubSub.publish("connected", service);
    }
  }

  protected async emitServiceDisconnected(service: Service, nodeId: string): Promise<void> {
    if (!this.working) {
      return;
    }
    const foundService = this.registry.findServiceByHash(service.hash);
    if (!foundService || !foundService.nodeIdMap.delete(nodeId)) { // unknown service
      this.props.logger.error(`service broker has been disconnected from non-registered service node: ${service} (${nodeId})`);
    } else if (foundService.nodeIdMap.size === 0) { // service disconnected
      await this.discoveryPubSub.publish("disconnected", foundService);
      this.registry.removeServiceByHash(foundService.hash);
    } else { // node pool updated
      await this.discoveryPubSub.publish("nodePoolUpdated", foundService);
    }
  }

  /* context */
  public createContext(base: ContextBase): Context {
    return this.delegator.createContext(base);
  }

  public clearContext(context: Context): void {
    this.batchingPoolMap.delete(context);
    this.unsubscribeEvent(context);
  }

  /* action call */
  public async call(context: Context, args: CallArgs): Promise<any> {
    const {action, params, batchingParams, disableCache} = args;
    const node = this.delegator.selectActionTargetNode(context, action)!;
    console.assert(node && action, "there are no available nodes to call the action");

    // do batching
    if (batchingParams) {
      const batchingPool = this.batchingPoolMap.get(context)!;
      const batchingParamNames = Object.keys(batchingParams);
      const batchingKey = batchingPool.getBatchingKey({action: action.id, params, batchingParamNames});

      // set batching handler for this call
      if (!batchingPool.hasBatchingHandler(batchingKey)) { // or register job
        batchingPool.setBatchingHandler(batchingKey, async (batchingParamsList: any[]) => {

          // merge common params with batching params
          const mergedParams = (params || {}) as any;
          for (const batchingParamName of batchingParamNames) {
            mergedParams[batchingParamName] = [];
          }

          for (const bParams of batchingParamsList) {
            for (const [k, v] of Object.entries(bParams)) {
              mergedParams[k].push(v);
            }
          }

          // do batching call
          const response = await this.delegator.call(context, {action, node, params: mergedParams, disableCache});
          this.registry.addActionExample({action, params: mergedParams, response});
          return response;
        });
      }

      // add batch entry and wait response
      return batchingPool.batch(batchingKey, batchingParams);

    } else {

      // normal request
      const response = await this.delegator.call(context, {action, node, params, disableCache});
      this.registry.addActionExample({action, params, response});
      return response;
    }
  }

  /* action call cache */
  public async clearActionCache(action: Readonly<ServiceAction>): Promise<void> {
    if (await this.delegator.clearActionCache(action)) {
      this.props.logger.info(`${action} action caches have been cleared`);
    }
  }

  public async clearServiceCache(service: Readonly<Service>): Promise<void> {
    if (await this.delegator.clearServiceCache(service)) {
      this.props.logger.info(`${service} service caches have been cleared`);
    }
  }

  public async clearAllCache(): Promise<void> {
    if (await this.delegator.clearAllCache()) {
      this.props.logger.info(`all caches have been cleared`);
    }
  }

  /* event pub/sub */
  public async subscribeEvent<Listener extends EventListener | null>(context: Context, eventNamePattern: string, listener: Listener): Promise<Listener extends EventListener ? void : AsyncIterator<Readonly<EventPacket>>> {
    let subscriptions = this.eventSubscriptionMap.get(context);
    if (!subscriptions) {
      subscriptions = [];
      this.eventSubscriptionMap.set(context, subscriptions);
    }

    if (listener) {
      subscriptions.push(...(await this.eventPubSub.subscribe(eventNamePattern, listener!)));
      return undefined as any;
    }

    // returns event packet async iterator when no listener given
    const iterator = this.eventPubSub.asyncIterator(eventNamePattern);
    subscriptions.push(iterator);
    return iterator as any;
  }

  public async unsubscribeEvent(context: Context): Promise<void> {
    const subscriptions = this.eventSubscriptionMap.get(context);
    if (subscriptions) {
      for (const subscription of subscriptions) {
        if (typeof subscription === "number") {
          this.eventPubSub.unsubscribe(subscription);
        } else if (subscription.return) {
          await subscription.return();
        }
      }
      this.eventSubscriptionMap.delete(context);
    }
  }

  public async publishEvent(context: Context, args: EventPublishArgs): Promise<void> {
    const packet = await this.delegator.publish(context, args);
    this.registry.addEventExample(this.resolveEventName(args.event), packet);
  }

  /* params mapper */
  public createParamsMapper<MappableArgs>(opts: ParamsMapperProps): ParamsMapper<MappableArgs> {
    return new ParamsMapper<MappableArgs>(opts);
  }

  /* compile inline function string */
  public createInlineFunction<MappableArgs, Return>(props: InlineFunctionProps<MappableArgs>): (args: MappableArgs) => Return {
    return createInlineFunction<MappableArgs, Return>(props, this.opts.function);
  }

  /* service reporter */
  public createReporter(service: Readonly<Service>): Reporter {
    return new Reporter({
      logger: this.props.logger.getChild(`${service}`),
      service,
      props: null,
      send: (messages, table) => this.delegator.report(service, messages, table),
    }, this.opts.reporter);
  }

  /* pattern matching for action and event names */
  public matchActionName(name: string, namePattern: string): boolean {
    return this.delegator.actionNameResolver(name).includes(namePattern);
  }

  public resolveActionName(name: string): string[] {
    return this.delegator.actionNameResolver(name);
  }

  public matchEventName(name: string, namePattern: string): boolean {
    return this.delegator.eventNameResolver(name).includes(namePattern);
  }

  public resolveEventName(name: string): string[] {
    return this.delegator.eventNameResolver(name);
  }

  /* health check */
  public healthCheckService(service: Readonly<Service>) {
    return this.delegator.healthCheckService(service);
  }

  public healthCheckCall(action: Readonly<ServiceAction>) {
    return this.delegator.healthCheckCall(action);
  }

  public healthCheckPublish(args: Omit<EventPublishArgs, "params">) {
    return this.delegator.healthCheckPublish(args);
  }

  public healthCheckSubscribe() {
    return this.delegator.healthCheckSubscribe();
  }
}

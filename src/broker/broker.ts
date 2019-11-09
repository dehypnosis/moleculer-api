import * as kleur from "kleur";
import * as _ from "lodash";
import { RecursivePartial } from "../interface";
import { Logger } from "../logger";
import { APIRequestContext } from "../server";
import { ServiceRegistry, ServiceRegistryOptions, Service, ServiceAction, ServiceNode } from "./registry";
import { Reporter, ReporterOptions } from "./reporter";
import { EventPubSub, EventPacket, DiscoveryPubSub, EventListener } from "./pubsub";
import { ParamsMapper, ParamsMapperProps } from "./params";
import { BatchingPool, BatchingPoolOptions } from "./batching";
import { createInlineFunction, InlineFunctionOptions, InlineFunctionProps } from "./function";
import { ServiceBrokerDelegatorConstructors, ServiceBrokerDelegatorConstructorOptions, ServiceBrokerDelegator } from "./delegator";

export type ServiceBrokerOptions = {
  registry: ServiceRegistryOptions;
  batching: BatchingPoolOptions;
  function: InlineFunctionOptions;
  reporter: ReporterOptions;
  log: {
    event: boolean;
    call: boolean;
  },
} & ServiceBrokerDelegatorConstructorOptions;

export type ServiceBrokerProps = {
  id: string;
  logger: Logger;
};

export type ServiceBrokerListeners = {
  connected: (service: Readonly<Service>) => void;
  disconnected: (service: Readonly<Service>) => void;
  nodePoolUpdated: (service: Readonly<Service>) => void;
};

export type CallArgs = { action: Readonly<ServiceAction>, params?: any, batchingParams?: any, disableCache: boolean};
export type EventPublishArgs = Omit<EventPacket, "from">;
export type DelegatedCallArgs = Omit<CallArgs, "batchingParams"> & { node: Readonly<ServiceNode> };
export type DelegatedEventPublishArgs = EventPublishArgs;

export class ServiceBroker<DelegatorContext = any> {
  private readonly registry: ServiceRegistry;
  private readonly delegator: ServiceBrokerDelegator<DelegatorContext>;
  private readonly delegatorSymbol: symbol;
  private readonly discoveryPubSub: DiscoveryPubSub;
  private readonly eventPubSub: EventPubSub;
  private readonly opts: RecursivePartial<ServiceBrokerOptions>;

  constructor(protected readonly props: ServiceBrokerProps, opts?: RecursivePartial<ServiceBrokerOptions>) {
    // save options
    this.opts = _.defaultsDeep(opts || {}, {
      log: {
        event: true,
        call: true,
      },
    });

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

    this.delegatorSymbol = Symbol(`BrokerDelegator:${this.props.id}`);

    // create event buses
    this.eventPubSub = new EventPubSub({
      onError: error => this.props.logger.error(error),
      eventNamePatternResolver: this.delegator.eventNameResolver,
      maxListeners: Infinity,
    });

    this.discoveryPubSub = new DiscoveryPubSub({
      onError: error => this.props.logger.error(error),
    });

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

    // publish and store
    await this.eventPubSub.publish(packet.event, packet);
    this.registry.addEventExample(this.resolveEventName(packet.event), packet);

    // log
    this.props.logger[this.opts.log!.event! ? "info" : "debug"](`received ${kleur.green(packet.event)} ${packet.broadcast ? "broadcast " : ""}event from ${kleur.yellow(packet.from || "unknown")}`);
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

  /* context resource management */
  private getDelegatorContext(context: APIRequestContext): DelegatorContext {
    let delegatorContext: DelegatorContext | undefined = context.get(this.delegatorSymbol);
    if (!delegatorContext) {
      delegatorContext = this.delegator.createContext(context);
      context.set(this.delegatorSymbol, delegatorContext, ctx => this.delegator.clearContext(ctx));
    }
    return delegatorContext;
  }

  private static EventSubscriptionSymbol = Symbol("BrokerEventSubscriptions");

  private getEventSubscriptions(context: APIRequestContext): Array<number | AsyncIterator<EventPacket>> {
    let subscriptions: Array<number | AsyncIterator<EventPacket>> | undefined = context.get(ServiceBroker.EventSubscriptionSymbol);
    if (!subscriptions) {
      subscriptions = [];
      context.set(ServiceBroker.EventSubscriptionSymbol, subscriptions, subs => {
        for (const sub of subs) {
          this.unsubscribeEvent(sub);
        }
      });
    }
    return subscriptions;
  }

  private static BatchingPoolSymbol = Symbol("BrokerBatchingPool");

  private getBatchingPool(context: APIRequestContext): BatchingPool {
    let batchingPool: BatchingPool | undefined = context.get(ServiceBroker.BatchingPoolSymbol);
    if (!batchingPool) {
      batchingPool = new BatchingPool(this.opts.batching);
      context.set(ServiceBroker.BatchingPoolSymbol, batchingPool, pool => {
        pool.clear();
      });
    }
    return batchingPool;
  }

  /* action call */
  public async call(context: APIRequestContext, args: CallArgs): Promise<any> {
    const ctx = this.getDelegatorContext(context);
    const {action, params, batchingParams, disableCache} = args;
    const node = this.delegator.selectActionTargetNode(ctx, action)!;
    console.assert(node && action, "there are no available nodes to call the action");

    // do batching
    if (batchingParams) {
      const batchingPool = this.getBatchingPool(context);
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

          // log in advance
          this.props.logger[this.opts.log!.call! ? "info" : "debug"](`call ${action}${kleur.cyan("@")}${node} ${kleur.cyan(batchingParamsList.length)} times in a batch from ${kleur.yellow((context.id || "unknown") + "@" + (context.ip || "unknown"))}`);

          // do batching call
          const response = await this.delegator.call(ctx, {action, node, params: mergedParams, disableCache});
          this.registry.addActionExample({action, params: mergedParams, response});
          return response;
        });
      }

      // add batch entry and wait response
      return batchingPool.batch(batchingKey, batchingParams);

    } else {
      // log in advance
      this.props.logger[this.opts.log!.call! ? "info" : "debug"](`call ${action}${kleur.cyan("@")}${node} from ${kleur.yellow((context.id || "unknown") + "@" + (context.ip || "unknown"))}`);

      // normal request
      const response = await this.delegator.call(ctx, {action, node, params, disableCache});
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
  public async subscribeEvent<Listener extends EventListener | null>(context: APIRequestContext, eventNamePattern: string, listener: Listener): Promise<Listener extends EventListener ? void : AsyncIterator<Readonly<EventPacket>>> {
    const subscriptions = this.getEventSubscriptions(context);

    if (listener) {
      subscriptions.push(...(await this.eventPubSub.subscribe(eventNamePattern, listener!)));
      return undefined as any;
    }

    // returns event packet async iterator when no listener given
    const iterator = this.eventPubSub.asyncIterator(eventNamePattern);
    subscriptions.push(iterator);
    return iterator as any;
  }

  public async unsubscribeEvent(subscription: number | AsyncIterator<EventPacket>): Promise<void> {
    if (typeof subscription === "number") {
      this.eventPubSub.unsubscribe(subscription);
    } else if (subscription.return) {
      await subscription.return();
    }
  }

  public async publishEvent(context: APIRequestContext, args: EventPublishArgs): Promise<void> {
    const ctx = this.getDelegatorContext(context);
    await this.delegator.publish(ctx, args);

    // add from information to original packet and store as example
    const packet: EventPacket = args;
    packet.from = `${context.id || "unknown"}@${context.ip || "unknown"}`;
    this.registry.addEventExample(this.resolveEventName(args.event), packet);

    // log
    this.props.logger[this.opts.log!.event! ? "info" : "debug"](`published ${kleur.green(packet.event)} ${packet.broadcast ? "broadcast " : ""}event from ${kleur.yellow(packet.from!)}`);
  }

  /* params mapper */
  public createParamsMapper<MappableArgs>(opts: ParamsMapperProps): ParamsMapper<MappableArgs> {
    return new ParamsMapper<MappableArgs>(opts);
  }

  /* compile inline function string */
  public createInlineFunction<MappableArgs, Return>(props: InlineFunctionProps<MappableArgs, Return>): (args: MappableArgs) => Return {
    return createInlineFunction<MappableArgs, Return>(props, this.opts.function);
  }

  /* service reporter */
  public createReporter(service: Readonly<Service>): Reporter {
    return new Reporter({
      logger: this.props.logger.getChild(`${service}
`),
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

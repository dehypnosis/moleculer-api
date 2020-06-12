import * as Moleculer from "moleculer";
import fs from "fs";
import { ServiceMetaDataSchema } from "../../../schema";
import { APIRequestContext } from "../../../server";
import { isReadStream } from "../../../interface";
import { Service, ServiceAction, ServiceNode, ServiceStatus } from "../../registry";
import { Report } from "../../reporter";
import { defaultNamePatternResolver, NamePatternResolver } from "../../name";
import { ServiceBrokerDelegator, ServiceBrokerDelegatorProps, DelegatedCallArgs, DelegatedEventPublishArgs } from "../delegator";
import { proxyMoleculerServiceDiscovery } from "./discover";
import { createMoleculerLoggerOptions } from "./logger";
import { createMoleculerServiceSchema } from "./service";

export type MoleculerServiceBrokerDelegatorOwnOptions = {
  streamingCallTimeout: number; // ms, default is one hour
  streamingToStringEncoding: "ascii" | "utf8" | "utf-8" | "utf16le" | "ucs2" | "ucs-2" | "base64" | "latin1" | "binary" | "hex"; // default is base64, check your transporter on malformed streaming
}

export type MoleculerServiceBrokerDelegatorOptions = Moleculer.BrokerOptions
  & Partial<MoleculerServiceBrokerDelegatorOwnOptions & {
    services: (Moleculer.ServiceSchema & { metadata?: ServiceMetaDataSchema })[];
  }>;

type Context = Moleculer.Context;

export class MoleculerServiceBrokerDelegator extends ServiceBrokerDelegator<Context> {
  public static readonly key = "moleculer";
  public readonly broker: Moleculer.ServiceBroker;
  private readonly service: Moleculer.Service;
  private readonly opts: MoleculerServiceBrokerDelegatorOwnOptions;

  constructor(protected readonly props: ServiceBrokerDelegatorProps, opts?: MoleculerServiceBrokerDelegatorOptions) {
    super(props);

    const {
      services = [],
      streamingCallTimeout = 1000 * 3600,
      streamingToStringEncoding = "base64",
      ...moleculerBrokerOptions
    } = opts || {};

    this.opts = {
      streamingCallTimeout,
      streamingToStringEncoding,
    };
    const bOpts = moleculerBrokerOptions as Moleculer.BrokerOptions;
    bOpts.logger = createMoleculerLoggerOptions(this.props.logger);
    bOpts.skipProcessEventRegistration = true;
    this.broker = new Moleculer.ServiceBroker(bOpts);

    // create optional moleculer services with this broker
    if (services) {
      for (const serviceSchema of services) {
        this.broker.createService(serviceSchema);
      }
    }

    // create a service which handles event and service discovery
    this.service = this.broker.createService(createMoleculerServiceSchema(props));
  }

  /* action/event name matching for call, publish, subscribe, clear cache */
  public readonly actionNameResolver: NamePatternResolver = defaultNamePatternResolver;
  public readonly eventNameResolver: NamePatternResolver = defaultNamePatternResolver;

  /* lifecycle */
  public async start(): Promise<void> {
    await this.service._start();
    await this.broker.start();

    // emit local node discovery event
    this.broker.getLocalNodeInfo();
    const localServices = proxyMoleculerServiceDiscovery(this.broker.registry.nodes.localNode);
    for (const service of localServices) {
      this.props.emitServiceConnected(service);
    }
  }

  public async stop(): Promise<void> {
    // emit local node discovery event
    this.broker.getLocalNodeInfo();
    const localServices = proxyMoleculerServiceDiscovery(this.broker.registry.nodes.localNode);
    for (const service of localServices) {
      this.props.emitServiceDisconnected(service, this.broker.nodeID);
    }

    await this.broker.stop();
  }

  /* create context for request */
  public createContext(base: APIRequestContext): Context {
    const context = Moleculer.Context.create(this.broker);
    context.requestID = base.id || null; // copy request id
    this.props.logger.debug(`${context.requestID} moleculer context created`);
    return context;
  }

  public clearContext(context: Context): void {
    this.props.logger.debug(`${context.requestID} moleculer context cleared`);
  }

  /* call action */
  public selectActionTargetNode(context: Context, action: Readonly<ServiceAction>): Readonly<ServiceNode> | null {
    const epList = (this.broker.registry as any).getActionEndpoints(action.id);
    if (!epList) {
      return null;
    }

    const candidateNodeIdMap = action.service.nodeIdMap;
    const endpoints = epList.endpoints.filter((ep: { isAvailable: any; id: string; }) => ep.isAvailable && candidateNodeIdMap.has(ep.id));
    if (endpoints.length === 0) {
      return null;
    }

    const endpoint = epList.select(endpoints, context);
    if (endpoint) {
      return candidateNodeIdMap.get(endpoint.id) || null;
    }

    return null;
  }

  public async call(context: Context, args: DelegatedCallArgs): Promise<any> {
    const {action, node, params, disableCache} = args;
    if (disableCache) {
      (context.meta as any).$cache = false;
    }

    let response: any;

    // create child context
    const ctx = Moleculer.Context.create(this.broker);

    // prepare streaming request
    let callParams = params;
    const callOpts: any = {
      nodeID: node?.id,
      parentCtx: context,
    };
    if (typeof params === "object" && params !== null) {
      // pipe streaming data only when root object has stream
      if (typeof params.createReadStream === "function") {
        const {createReadStream, ...meta} = params;
        const stream = params.createReadStream();
        if (!isReadStream(stream)) {
          throw new Error("invalid stream request"); // TODO: normalize error
        }

        callParams = stream;
        callOpts.meta = meta;
        callOpts.retries = 0;
        callOpts.timeout = this.opts.streamingCallTimeout;

      // read all file streams as buffer for child stream params
      } else if (await this.parseNestedStreamAsBuffer(callParams)) {
        callOpts.retries = 0;
        callOpts.timeout = this.opts.streamingCallTimeout;
      }
    }

    // call the action
    response = await ctx.call(action.id, callParams, callOpts);

    // streaming response (can obtain other props from ctx.meta in streaming response)
    if (isReadStream(response)) {
      return {
        createReadStream: () => response,
        ...ctx.meta,
      };
    } else {
      // normal response
      return response;
    }
  }

  private async parseNestedStreamAsBuffer(v: any): Promise<boolean> {
    if (Array.isArray(v)) {
      // return either any props had a stream or not.
      return (await Promise.all(v.map((vv: any) => this.parseNestedStreamAsBuffer(vv)))).some(p => !!p);

    } else if (typeof v === "object" && v !== null) {

      // found a stream object
      if (typeof (v as any).createReadStream === "function") {
        const stream: fs.ReadStream = (v as any).createReadStream();
        delete (v as any).createReadStream;
        if (!isReadStream(stream)) {
          throw new Error("invalid stream request"); // TODO: normalize error
        }

        // read stream as buffer string with given encoding
        await new Promise<string>((resolve, reject) => {
          const chunks: any[] = [];
          stream
            .on("data", chunk => chunks.push(chunk))
            .on("error", reject)
            .on("end", () => {
              try {
                (v as any).buffer = Buffer.concat(chunks).toString(this.opts.streamingToStringEncoding);
                (v as any).encoding = this.opts.streamingToStringEncoding;
                resolve();
              } catch (err) {
                reject(err);
              }
            })
        });
        return true;

      } else {
        // return either any props had a stream or not.
        return (await Promise.all(Object.values(v).map(vv => this.parseNestedStreamAsBuffer(vv)))).some(p => !!p);
      }
    }

    return false;
  }

  /* publish event */
  public async publish(context: Context, args: DelegatedEventPublishArgs): Promise<void> {
    const {event, params, groups, broadcast} = args;
    const publish = broadcast ? this.broker.broadcast : this.broker.emit;
    publish(event, params, {groups: groups && groups.length > 0 ? groups : undefined, parentCtx: context});
  }

  /* cache management */
  public async clearActionCache(action: Readonly<ServiceAction>): Promise<boolean> {
    try {
      await this.broker.cacher!.clean(`${action.id}:**`);
      return true;
    } catch {
      return false;
    }
  }

  public async clearServiceCache(service: Readonly<Service>): Promise<boolean> {
    try {
      await this.broker.cacher!.clean(`${service.id}.**`);
      return true;
    } catch {
      return false;
    }
  }

  public async clearAllCache(): Promise<boolean> {
    try {
      await this.broker.cacher!.clean();
      return true;
    } catch {
      return false;
    }
  }

  /* health check */
  public async healthCheckCall(action: Readonly<ServiceAction>): Promise<ServiceStatus> {
    const updatedAt = new Date();

    const transit = this.broker.transit;
    const connected = !!(transit && transit.isReady);
    if (!connected) {
      return {
        message: `service broker is disconnected`,
        code: 503,
        updatedAt,
      };
    }

    // action endpoint given
    const candidateNodeIdMap = action.service.nodeIdMap;
    const epList = this.broker.registry.actions.actions.get(action);
    const endpoints = epList ? epList.endpoints.filter((ep: any) => candidateNodeIdMap.has(ep.id)) : [];

    if (endpoints.length === 0) {
      return {
        message: "there are no action endpoints",
        code: 404,
        updatedAt,
      };
    }

    const unavailableEndpoints = endpoints.filter((ep: any) => !ep.state || !ep.node.available);
    const available = `${endpoints.length - unavailableEndpoints.length}/${endpoints.length} available`;

    if (unavailableEndpoints.length === endpoints.length) {
      return {
        message: `there are no available action endpoints: ${available}`,
        code: 503,
        updatedAt,
      };
    }

    return {
      message: `there are available action endpoints: ${available}`,
      code: 200,
      updatedAt,
    };
  }

  public async healthCheckPublish(args: Omit<DelegatedEventPublishArgs, "params">): Promise<ServiceStatus> {
    const {event, groups, broadcast} = args; // ignore params
    const updatedAt = new Date();

    const transit = this.broker.transit;
    const connected = !!(transit && transit.connected);
    if (!connected) {
      return {
        message: `service broker is disconnected`,
        code: 503,
        updatedAt,
      };
    }

    // status of event subscription
    const endpoints = this.broker.registry.events.getAllEndpoints(event, groups);
    if (endpoints.length === 0) {
      return {
        message: `there are no subscription endpoints for the given event`,
        code: 404,
        updatedAt,
      };
    }

    const unavailableEndpoints = endpoints.filter((ep: any) => !ep.state || !ep.node.available);
    const available = `${endpoints.length - unavailableEndpoints.length}/${endpoints.length} available`;
    if (broadcast) {
      if (unavailableEndpoints.length > 0) {
        return {
          message: `there are unavailable subscription endpoints for broadcasting: ${available}`,
          code: 503,
          updatedAt,
        };
      }

      return {
        message: `all subscription endpoints are available for broadcasting: ${available}`,
        code: 200,
        updatedAt,
      };
    }

    if (unavailableEndpoints.length === endpoints.length) {
      return {
        message: `there are no available subscription endpoints: ${available}`,
        code: 503,
        updatedAt,
      };
    }

    return {
      message: `there are available endpoints: ${available}`,
      code: 200,
      updatedAt,
    };
  }

  public async healthCheckSubscribe(): Promise<ServiceStatus> {
    // just check transit status
    const transit = this.broker.transit;
    const connected = !!(transit && transit.connected);
    return {
      message: connected ? `event subscription is available` : `service broker is disconnected`,
      code: connected ? 200 : 503,
      updatedAt: new Date(),
    };
  }

  public async healthCheckService(service: Readonly<Service>): Promise<ServiceStatus> {
    const updatedAt = new Date();
    const transit = this.broker.transit;
    const connected = !!(transit && transit.connected);
    if (!connected) {
      return {
        message: `service broker is disconnected`,
        code: 503,
        updatedAt,
      };
    }

    // find service
    const services = this.broker.registry.services.services.filter((svc: any) => service.nodeIdMap.has(svc.node.id) && svc.name === service.id);
    if (services.length === 0) {
      return {
        message: "cannot find the service",
        code: 404,
        updatedAt,
      };
    }

    const unavailableServices = services.filter((svc: any) => svc.node.available);
    const available = `${services.length - unavailableServices.length}/${services.length} available`;
    const ok = unavailableServices.length === services.length;
    return {
      message: ok ? `there are no available services: ${available}` : `there are available services: ${available}`,
      code: ok ? 200 : 503,
      updatedAt,
    };
  }

  /* send reporter to service */
  public async report(service: Readonly<Service>, messages: Readonly<Report>[], table: string): Promise<void> {
    const action = `${service.id}.$report`;
    const params = {messages, table};
    const payloads = Array.from(service.nodeIdMap.keys())
      .map(nodeID => ({action, params, nodeID }));
    await this.broker.mcall(payloads, { retries: 3, timeout: 3000 });
  }
}

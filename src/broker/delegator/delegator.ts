import { APIRequestContext } from "../../server";
import { HasStaticKey } from "../../interface";
import { Logger } from "../../logger";
import { Service, ServiceAction, ServiceNode, ServiceStatus } from "../registry";
import { Report } from "../reporter";
import { EventPacket } from "../pubsub";
import { NamePatternResolver } from "../name";
import { DelegatedCallArgs, DelegatedEventPublishArgs } from "../broker";
export { DelegatedCallArgs, DelegatedEventPublishArgs };

export type ServiceBrokerDelegatorProps = {
  logger: Logger;
  emitEvent(packet: EventPacket): void;
  emitServiceConnected(service: Service): void;
  emitServiceDisconnected(service: Service, nodeId: string): void;
};

export abstract class ServiceBrokerDelegator<Context> extends HasStaticKey {
  constructor(protected readonly props: ServiceBrokerDelegatorProps, opts?: any) {
    super();
  }

  /* action/event name matching for call, publish, subscribe, clear cache */
  public abstract readonly actionNameResolver: NamePatternResolver;
  public abstract readonly eventNameResolver: NamePatternResolver;

  /* lifecycle */
  public abstract start(): Promise<void>;

  public abstract stop(): Promise<void>;

  /* create context for request */
  public abstract createContext(base: APIRequestContext): Context;

  public abstract clearContext(context: Context): void;

  /* call action */
  public abstract selectActionTargetNode(context: Context, action: Readonly<ServiceAction>): Readonly<ServiceNode> | null;

  public abstract call(context: Context, args: DelegatedCallArgs): Promise<any>;

  /* publish event */
  public abstract publish(context: Context, args: DelegatedEventPublishArgs): Promise<void>;

  /* send reporter to service */
  public abstract report(service: Readonly<Service>, messages: Array<Readonly<Report>>, table: string): Promise<void>;

  /* health check */
  public abstract healthCheckCall(action: Readonly<ServiceAction>): Promise<ServiceStatus>;

  public abstract healthCheckPublish(args: Omit<DelegatedEventPublishArgs, "params">): Promise<ServiceStatus>;

  public abstract healthCheckSubscribe(): Promise<ServiceStatus>;

  public abstract healthCheckService(service: Readonly<Service>): Promise<ServiceStatus>;

  /* cache management */
  public abstract clearActionCache(action: Readonly<ServiceAction>): Promise<boolean>;

  public abstract clearServiceCache(service: Readonly<Service>): Promise<boolean>;

  public abstract clearAllCache(): Promise<boolean>;
}

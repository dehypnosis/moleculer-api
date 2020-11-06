import { APIRequestContext } from "../../server";
import { HasStaticKey } from "../../interface";
import { Logger } from "../../logger";
import { Service, ServiceAction, ServiceNode, ServiceStatus } from "../registry";
import { Report } from "../reporter";
import { EventPacket } from "../pubsub";
import { DelegatedCallArgs, DelegatedEventPublishArgs } from "../broker";
export { DelegatedCallArgs, DelegatedEventPublishArgs };
export declare type ServiceBrokerDelegatorProps = {
    logger: Logger;
    emitEvent(packet: EventPacket): void;
    emitServiceConnected(service: Service): void;
    emitServiceDisconnected(service: Service, nodeId: string): void;
};
export declare abstract class ServiceBrokerDelegator<Context> extends HasStaticKey {
    protected readonly props: ServiceBrokerDelegatorProps;
    constructor(props: ServiceBrokerDelegatorProps, opts?: any);
    abstract readonly broker: any;
    abstract matchActionName(name: string, namePattern: string): boolean;
    abstract matchEventName(name: string, namePattern: string): boolean;
    abstract start(): Promise<void>;
    abstract stop(): Promise<void>;
    abstract createContext(base: APIRequestContext): Context;
    abstract clearContext(context: Context): void;
    abstract selectActionTargetNode(context: Context, action: Readonly<ServiceAction>): Readonly<ServiceNode> | null;
    abstract call(context: Context, args: DelegatedCallArgs): Promise<any>;
    abstract publish(context: Context, args: DelegatedEventPublishArgs): Promise<void>;
    abstract report(service: Readonly<Service>, messages: Readonly<Report>[], table: string): Promise<void>;
    abstract healthCheckCall(action: Readonly<ServiceAction>): Promise<ServiceStatus>;
    abstract healthCheckPublish(args: Omit<DelegatedEventPublishArgs, "params">): Promise<ServiceStatus>;
    abstract healthCheckSubscribe(): Promise<ServiceStatus>;
    abstract healthCheckService(service: Readonly<Service>): Promise<ServiceStatus>;
    abstract clearActionCache(action: Readonly<ServiceAction>): Promise<boolean>;
    abstract clearServiceCache(service: Readonly<Service>): Promise<boolean>;
    abstract clearAllCache(): Promise<boolean>;
}

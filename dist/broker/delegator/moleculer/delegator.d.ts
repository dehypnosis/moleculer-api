import * as Moleculer from "moleculer";
import { ServiceMetaDataSchema } from "../../../schema";
import { APIRequestContext } from "../../../server";
import { Service, ServiceAction, ServiceNode, ServiceStatus } from "../../registry";
import { Report } from "../../reporter";
import { NamePatternResolver } from "../../name";
import { ServiceBrokerDelegator, ServiceBrokerDelegatorProps, DelegatedCallArgs, DelegatedEventPublishArgs } from "../delegator";
export declare type MoleculerServiceBrokerDelegatorOptions = Moleculer.BrokerOptions & {
    services?: (Moleculer.ServiceSchema & {
        metadata?: ServiceMetaDataSchema;
    })[];
};
declare type Context = Moleculer.Context;
export declare class MoleculerServiceBrokerDelegator extends ServiceBrokerDelegator<Context> {
    protected readonly props: ServiceBrokerDelegatorProps;
    static readonly key = "moleculer";
    readonly broker: Moleculer.ServiceBroker;
    private readonly service;
    constructor(props: ServiceBrokerDelegatorProps, opts?: MoleculerServiceBrokerDelegatorOptions);
    readonly actionNameResolver: NamePatternResolver;
    readonly eventNameResolver: NamePatternResolver;
    start(): Promise<void>;
    stop(): Promise<void>;
    createContext(base: APIRequestContext): Context;
    clearContext(context: Context): void;
    selectActionTargetNode(context: Context, action: Readonly<ServiceAction>): Readonly<ServiceNode> | null;
    call(context: Context, args: DelegatedCallArgs): Promise<any>;
    publish(context: Context, args: DelegatedEventPublishArgs): Promise<void>;
    clearActionCache(action: Readonly<ServiceAction>): Promise<boolean>;
    clearServiceCache(service: Readonly<Service>): Promise<boolean>;
    clearAllCache(): Promise<boolean>;
    healthCheckCall(action: Readonly<ServiceAction>): Promise<ServiceStatus>;
    healthCheckPublish(args: Omit<DelegatedEventPublishArgs, "params">): Promise<ServiceStatus>;
    healthCheckSubscribe(): Promise<ServiceStatus>;
    healthCheckService(service: Readonly<Service>): Promise<ServiceStatus>;
    report(service: Readonly<Service>, messages: Readonly<Report>[], table: string): Promise<void>;
}
export {};

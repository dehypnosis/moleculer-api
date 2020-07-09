import * as Moleculer from "moleculer";
import { ServiceMetaDataSchema } from "../../../schema";
import { APIRequestContext } from "../../../server";
import { Service, ServiceAction, ServiceNode, ServiceStatus } from "../../registry";
import { Report } from "../../reporter";
import { NamePatternResolver } from "../../name";
import { ServiceBrokerDelegator, ServiceBrokerDelegatorProps, DelegatedCallArgs, DelegatedEventPublishArgs } from "../delegator";
export declare type MoleculerServiceBrokerDelegatorOwnOptions = {
    batchedCallTimeout: (itemCount: number) => number;
    streamingCallTimeout: number;
    streamingToStringEncoding: "ascii" | "utf8" | "utf-8" | "utf16le" | "ucs2" | "ucs-2" | "base64" | "latin1" | "binary" | "hex";
};
export declare type MoleculerServiceBrokerDelegatorOptions = Moleculer.BrokerOptions & Partial<MoleculerServiceBrokerDelegatorOwnOptions & {
    services: (Moleculer.ServiceSchema & {
        metadata?: ServiceMetaDataSchema;
    })[];
}>;
declare type Context = Moleculer.Context;
export declare class MoleculerServiceBrokerDelegator extends ServiceBrokerDelegator<Context> {
    protected readonly props: ServiceBrokerDelegatorProps;
    static readonly key = "moleculer";
    readonly broker: Moleculer.ServiceBroker;
    private readonly service;
    private readonly opts;
    constructor(props: ServiceBrokerDelegatorProps, opts?: MoleculerServiceBrokerDelegatorOptions);
    readonly actionNameResolver: NamePatternResolver;
    readonly eventNameResolver: NamePatternResolver;
    start(): Promise<void>;
    stop(): Promise<void>;
    createContext(base: APIRequestContext): Context;
    clearContext(context: Context): void;
    selectActionTargetNode(context: Context, action: Readonly<ServiceAction>): Readonly<ServiceNode> | null;
    call(context: Context, args: DelegatedCallArgs): Promise<any>;
    private parseNestedStreamAsBuffer;
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

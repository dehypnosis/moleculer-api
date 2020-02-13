import { RecursivePartial } from "../interface";
import { Logger } from "../logger";
import { APIRequestContext } from "../server";
import { ServiceRegistryOptions, Service, ServiceAction, ServiceNode } from "./registry";
import { Reporter, ReporterOptions } from "./reporter";
import { EventPacket, EventListener } from "./pubsub";
import { ParamsMapper, ParamsMapperProps } from "./params";
import { BatchingPoolOptions } from "./batching";
import { InlineFunctionOptions, InlineFunctionProps } from "./function";
import { ServiceBrokerDelegatorConstructorOptions } from "./delegator";
export declare type ServiceBrokerOptions = {
    registry: ServiceRegistryOptions;
    batching: BatchingPoolOptions;
    function: InlineFunctionOptions;
    reporter: ReporterOptions;
    log: {
        event: boolean;
        call: boolean;
    };
} & ServiceBrokerDelegatorConstructorOptions;
export declare type ServiceBrokerProps = {
    id: string;
    logger: Logger;
};
export declare type ServiceBrokerListeners = {
    connected: (service: Readonly<Service>) => void;
    disconnected: (service: Readonly<Service>) => void;
    nodePoolUpdated: (service: Readonly<Service>) => void;
};
export declare type CallArgs = {
    action: Readonly<ServiceAction>;
    params?: any;
    batchingParams?: any;
    disableCache: boolean;
};
export declare type EventPublishArgs = Omit<EventPacket, "from">;
export declare type DelegatedCallArgs = Omit<CallArgs, "batchingParams"> & {
    node: Readonly<ServiceNode>;
};
export declare type DelegatedEventPublishArgs = EventPublishArgs;
export declare class ServiceBroker<DelegatorContext = any> {
    protected readonly props: ServiceBrokerProps;
    private readonly registry;
    private readonly delegator;
    private readonly delegatorSymbol;
    private readonly discoveryPubSub;
    private readonly eventPubSub;
    private readonly opts;
    constructor(props: ServiceBrokerProps, opts?: RecursivePartial<ServiceBrokerOptions>);
    private working;
    get delegatedBroker(): any;
    start(listeners: ServiceBrokerListeners): Promise<void>;
    stop(): Promise<void>;
    protected emitEvent(packet: EventPacket): Promise<void>;
    protected emitServiceConnected(service: Service): Promise<void>;
    protected emitServiceDisconnected(service: Service, nodeId: string): Promise<void>;
    private getDelegatorContext;
    private static EventSubscriptionSymbol;
    private getEventSubscriptions;
    private static BatchingPoolSymbol;
    private getBatchingPool;
    call(context: APIRequestContext, args: CallArgs): Promise<any>;
    clearActionCache(action: Readonly<ServiceAction>): Promise<void>;
    clearServiceCache(service: Readonly<Service>): Promise<void>;
    clearAllCache(): Promise<void>;
    subscribeEvent<Listener extends EventListener | null>(context: APIRequestContext, eventNamePattern: string, listener: Listener): Promise<Listener extends EventListener ? void : AsyncIterator<Readonly<EventPacket>>>;
    unsubscribeEvent(subscription: number | AsyncIterator<EventPacket>): Promise<void>;
    publishEvent(context: APIRequestContext, args: EventPublishArgs): Promise<void>;
    createParamsMapper<MappableArgs>(opts: ParamsMapperProps): ParamsMapper<MappableArgs>;
    createInlineFunction<MappableArgs, Return>(props: InlineFunctionProps<MappableArgs, Return>): (args: MappableArgs) => Return;
    createReporter(service: Readonly<Service>): Reporter;
    matchActionName(name: string, namePattern: string): boolean;
    resolveActionName(name: string): string[];
    matchEventName(name: string, namePattern: string): boolean;
    resolveEventName(name: string): string[];
    healthCheckService(service: Readonly<Service>): Promise<import("./registry").ServiceStatus>;
    healthCheckCall(action: Readonly<ServiceAction>): Promise<import("./registry").ServiceStatus>;
    healthCheckPublish(args: Omit<EventPublishArgs, "params">): Promise<import("./registry").ServiceStatus>;
    healthCheckSubscribe(): Promise<import("./registry").ServiceStatus>;
}

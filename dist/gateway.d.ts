import { ServiceBroker, ServiceBrokerOptions } from "./broker";
import { RecursivePartial } from "./interface";
import { SchemaRegistryOptions } from "./schema";
import { APIServerOptions } from "./server";
import { LoggerConstructorOptions } from "./logger";
export declare type APIGatewayOptions = {
    brokers?: RecursivePartial<ServiceBrokerOptions>[];
    schema?: RecursivePartial<SchemaRegistryOptions>;
    server?: RecursivePartial<APIServerOptions>;
    logger?: LoggerConstructorOptions;
} & RecursivePartial<APIGatewayOwnOptions>;
declare type APIGatewayOwnOptions = {
    skipProcessEventRegistration?: boolean;
};
export declare class APIGateway {
    readonly brokers: ServiceBroker[];
    private readonly schema;
    private readonly server;
    private readonly logger;
    private readonly opts;
    constructor(opts?: APIGatewayOptions);
    get delegatedBrokers(): any[];
    start(): Promise<void>;
    stop(): Promise<void>;
    static readonly ShutdownSignals: string[];
    private handleShutdown;
    private handleUncaughtError;
}
export {};

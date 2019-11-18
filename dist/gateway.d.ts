import { ServiceBrokerOptions } from "./broker";
import { RecursivePartial } from "./interface";
import { SchemaRegistryOptions } from "./schema";
import { APIServerOptions } from "./server";
import { LoggerConstructorOptions } from "./logger";
export declare type APIGatewayOptions = {
    brokers?: Array<RecursivePartial<ServiceBrokerOptions>>;
    schema?: RecursivePartial<SchemaRegistryOptions>;
    server?: RecursivePartial<APIServerOptions>;
    logger?: LoggerConstructorOptions;
} & RecursivePartial<APIGatewayOwnOptions>;
declare type APIGatewayOwnOptions = {
    skipProcessEventRegistration?: boolean;
};
export declare class APIGateway {
    private readonly brokers;
    private readonly schema;
    private readonly server;
    private readonly logger;
    private readonly opts;
    constructor(opts?: APIGatewayOptions);
    start(): Promise<void>;
    stop(): Promise<void>;
    static readonly ShutdownSignals: string[];
    private handleShutdown;
    private handleUncaughtError;
}
export {};

import { ServiceBroker } from "../broker";
import { ServiceBrokerDelegatorConstructorOptions } from "../broker/delegator";
import { RecursivePartial } from "../interface";
import { WinstonLogger } from "../logger";
import { SchemaRegistry, SchemaRegistryOptions } from "../schema";
import { APIServer, APIServerOptions } from "../server";
export declare function sleepUntil(predicate: () => boolean, timeoutSeconds?: number, sleepSeconds?: number): Promise<void>;
export declare function sleep(seconds: number): Promise<unknown>;
declare type getLoggerProps = {
    label?: string;
    level?: "info" | "warn" | "debug" | "error";
    silent?: boolean;
};
export declare function getLogger(props?: getLoggerProps): WinstonLogger;
export declare function getServiceBroker(props?: {
    logger?: getLoggerProps;
    delegator?: ServiceBrokerDelegatorConstructorOptions;
}): ServiceBroker<any>;
export declare function getSchemaRegistry(props?: {
    logger?: getLoggerProps;
    delegator?: ServiceBrokerDelegatorConstructorOptions;
    opts?: RecursivePartial<SchemaRegistryOptions>;
}): SchemaRegistry;
export declare function getAPIServer(props?: {
    logger?: getLoggerProps;
    schema?: SchemaRegistry;
    opts?: RecursivePartial<APIServerOptions>;
}): APIServer;
export {};

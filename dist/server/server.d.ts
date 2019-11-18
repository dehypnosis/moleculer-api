import { RecursivePartial } from "../interface";
import { Logger } from "../logger";
import { SchemaRegistry } from "../schema";
import { ServerApplicationOptions, APIRequestContextFactoryConstructorOptions } from "./application";
import { ServerMiddlewareConstructorOptions } from "./middleware";
import { ServerProtocolConstructorOptions } from "./protocol";
export declare type APIServerProps = {
    schema: SchemaRegistry;
    logger: Logger;
};
export declare type APIServerUpdateOptions = {
    debouncedSeconds: number;
    maxDebouncedSeconds: number;
};
export declare type APIServerOptions = {
    update: APIServerUpdateOptions;
    application: ServerApplicationOptions;
    middleware: ServerMiddlewareConstructorOptions;
    protocol: ServerProtocolConstructorOptions;
    context: APIRequestContextFactoryConstructorOptions;
};
export declare class APIServer {
    private props;
    private readonly opts;
    private readonly app;
    private readonly protocols;
    constructor(props: APIServerProps, opts?: RecursivePartial<APIServerOptions>);
    start(): Promise<void>;
    stop(): Promise<void>;
}

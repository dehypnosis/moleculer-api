export { ServerMiddleware } from "./middleware";
import { RecursivePartial } from "../../interface";
import { CORSMiddleware, CORSMiddlewareOptions } from "./cors";
import { HelmetMiddleware, HelmetMiddlewareOptions } from "./helmet";
import { ServeStaticMiddleware, ServeStaticMiddlewareOptions } from "./serve-static";
import { BodyParserMiddleware, BodyParserMiddlewareOptions } from "./body-parser";
import { LoggingMiddleware, LoggingMiddlewareOptions } from "./logging";
import { ErrorMiddleware, ErrorMiddlewareOptions } from "./error";
export declare const ServerMiddlewareConstructors: {
    helmet: typeof HelmetMiddleware;
    cors: typeof CORSMiddleware;
    serveStatic: typeof ServeStaticMiddleware;
    bodyParser: typeof BodyParserMiddleware;
    logging: typeof LoggingMiddleware;
    error: typeof ErrorMiddleware;
};
export declare type ServerMiddlewareConstructorOptions = {
    [HelmetMiddleware.key]: RecursivePartial<HelmetMiddlewareOptions> | false;
    [CORSMiddleware.key]: RecursivePartial<CORSMiddlewareOptions> | false;
    [ServeStaticMiddleware.key]: RecursivePartial<ServeStaticMiddlewareOptions> | false;
    [BodyParserMiddleware.key]: RecursivePartial<BodyParserMiddlewareOptions> | false;
    [LoggingMiddleware.key]: RecursivePartial<LoggingMiddlewareOptions> | false;
    [ErrorMiddleware.key]: RecursivePartial<ErrorMiddlewareOptions> | false;
};
export declare const defaultServerMiddlewareConstructorOptions: ServerMiddlewareConstructorOptions;

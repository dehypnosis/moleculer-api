import morgan from "morgan";
import { RecursivePartial } from "../../interface";
import { LogLevel } from "../../logger";
import { ServerApplicationComponentModules } from "../application/component";
import { ServerMiddleware, ServerMiddlewareProps } from "./middleware";
export declare type LoggingMiddlewareOptions = {
    httpFormat: string;
    wsFormat: string;
    level: LogLevel;
} & Omit<morgan.Options, "stream">;
export declare class LoggingMiddleware extends ServerMiddleware {
    protected readonly props: ServerMiddlewareProps;
    static readonly key = "logging";
    static readonly autoLoadOptions: {
        httpFormat: string;
        wsFormat: string;
        level: "error" | "info" | "debug" | "warn";
    };
    private readonly opts;
    constructor(props: ServerMiddlewareProps, opts?: RecursivePartial<LoggingMiddlewareOptions>);
    apply(modules: ServerApplicationComponentModules): void;
}

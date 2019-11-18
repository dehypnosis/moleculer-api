import { IHelmetConfiguration } from "helmet";
import { RecursivePartial } from "../../interface";
import { ServerApplicationComponentModules } from "../application/component";
import { ServerMiddleware, ServerMiddlewareProps } from "./middleware";
export declare type HelmetMiddlewareOptions = IHelmetConfiguration;
export declare class HelmetMiddleware extends ServerMiddleware {
    protected readonly props: ServerMiddlewareProps;
    static readonly key = "helmet";
    static readonly autoLoadOptions = false;
    private readonly opts;
    constructor(props: ServerMiddlewareProps, opts?: RecursivePartial<HelmetMiddlewareOptions>);
    apply(modules: ServerApplicationComponentModules): void;
}

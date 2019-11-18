import { ServeStaticOptions } from "serve-static";
import { RecursivePartial } from "../../interface";
import { ServerApplicationComponentModules } from "../application/component";
import { ServerMiddleware, ServerMiddlewareProps } from "./middleware";
export declare type ServeStaticMiddlewareOptions = {
    dirRootPath: string;
    routeBasePath: string;
} & ServeStaticOptions;
export declare class ServeStaticMiddleware extends ServerMiddleware {
    protected readonly props: ServerMiddlewareProps;
    static readonly key = "serveStatic";
    static readonly autoLoadOptions = false;
    private readonly opts;
    constructor(props: ServerMiddlewareProps, opts?: RecursivePartial<ServeStaticMiddlewareOptions>);
    apply(modules: ServerApplicationComponentModules): void;
}

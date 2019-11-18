import { CorsOptions } from "cors";
import { RecursivePartial } from "../../interface";
import { ServerApplicationComponentModules } from "../application/component";
import { ServerMiddleware, ServerMiddlewareProps } from "./middleware";
export declare type CORSMiddlewareOptions = CorsOptions & {
    disableForWebSocket: boolean;
};
export declare class CORSMiddleware extends ServerMiddleware {
    protected readonly props: ServerMiddlewareProps;
    static readonly key = "cors";
    static readonly autoLoadOptions: CORSMiddlewareOptions;
    private readonly opts;
    constructor(props: ServerMiddlewareProps, opts?: RecursivePartial<CORSMiddlewareOptions>);
    apply(modules: ServerApplicationComponentModules): void;
}

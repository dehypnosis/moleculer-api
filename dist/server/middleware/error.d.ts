import { RecursivePartial } from "../../interface";
import { ServerApplicationComponentModules } from "../application/component";
import { ServerMiddleware, ServerMiddlewareProps } from "./middleware";
export declare type ErrorMiddlewareOptions = {
    displayErrorStack: boolean;
    responseFormat: (obj: any) => any;
};
export declare class ErrorMiddleware extends ServerMiddleware {
    protected readonly props: ServerMiddlewareProps;
    static readonly key = "error";
    static readonly autoLoadOptions: {
        displayErrorStack: boolean;
    };
    private readonly opts;
    constructor(props: ServerMiddlewareProps, opts?: RecursivePartial<ErrorMiddlewareOptions>);
    apply(modules: ServerApplicationComponentModules): void;
    private handleHTTPError;
    private handleHTTPNotFound;
    private handleWebSocketError;
    private formatError;
}

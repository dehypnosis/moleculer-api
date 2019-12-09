import { Route, RouteProps } from "../route";
import express from "express-serve-static-core";
export declare type HTTPRouteRequest = express.Request;
export declare type HTTPRouteResponse = express.Response;
export declare type HTTPRouteNextFn = express.NextFunction;
export declare type HTTPRouteHandler<Context = any> = (context: Context, req: HTTPRouteRequest, res: HTTPRouteResponse) => void | Promise<void>;
export declare type HTTPRouteInternalHandler = (req: HTTPRouteRequest, res: HTTPRouteResponse, next: HTTPRouteNextFn) => void;
export declare type HTTPRouteProps<Context = any> = Omit<RouteProps, "handler"> & {
    handler: HTTPRouteHandler<Context>;
    method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
};
export declare class HTTPRoute extends Route {
    protected readonly props: HTTPRouteProps;
    constructor(props: Omit<HTTPRouteProps, "protocol">);
    get method(): "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
    get handler(): HTTPRouteHandler;
    isConflict(route: Readonly<Route>): boolean;
    toString(): string;
}

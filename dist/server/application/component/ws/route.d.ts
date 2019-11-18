/// <reference types="node" />
import { Route, RouteProps } from "../route";
import http from "http";
import http2 from "http2";
import ws from "ws";
export declare type WebSocket = ws;
export declare type WebSocketHTTPRequest = (http.IncomingMessage | http2.Http2ServerRequest) & {
    path: string;
    params: any;
    query: any;
};
export declare type WebSocketRouteHandler<Context = any> = (context: Context, socket: WebSocket, req: WebSocketHTTPRequest) => void;
export declare type WebSocketRouteInternalHandler = (socket: ws, req: WebSocketHTTPRequest) => void;
export declare type WebSocketRouteProps<Context = any> = Omit<RouteProps, "handler"> & {
    handler: WebSocketRouteHandler<Context>;
};
export declare class WebSocketRoute extends Route {
    protected readonly props: WebSocketRouteProps;
    constructor(props: Omit<WebSocketRouteProps, "protocol">);
    readonly handler: WebSocketRouteHandler;
    isConflict(route: Readonly<Route>): boolean;
}

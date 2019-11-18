import express from "express";
import { RecursivePartial } from "../../../../interface";
import { APIRequestContextConstructor } from "../../context";
import { RouteHandlerMap } from "../route";
import { ServerApplicationComponent, ServerApplicationComponentProps } from "../component";
import { HTTPRoute } from "./route";
export declare type ServerHTTPApplicationOptions = {
    trustProxy: boolean;
};
export declare class ServerHTTPApplication extends ServerApplicationComponent<HTTPRoute> {
    static readonly key = "http";
    readonly Route: typeof HTTPRoute;
    readonly module: express.Application;
    private readonly opts;
    private readonly routeHandlerExpressRouterMap;
    constructor(props: ServerApplicationComponentProps, opts?: RecursivePartial<ServerHTTPApplicationOptions>);
    start(): Promise<void>;
    stop(): Promise<void>;
    mountRoutes(routes: ReadonlyArray<Readonly<HTTPRoute>>, pathPrefixes: string[], createContext: APIRequestContextConstructor): Readonly<RouteHandlerMap<HTTPRoute>>;
    unmountRoutes(routeHandlerMap: Readonly<RouteHandlerMap<HTTPRoute>>): void;
    private unmountExpressRouter;
}

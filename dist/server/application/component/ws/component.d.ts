/// <reference types="node" />
import http from "http";
import http2 from "http2";
import net from "net";
import ws from "ws";
import { RecursivePartial } from "../../../../interface";
import { APIRequestContextConstructor } from "../../context";
import { RouteHandlerMap } from "../route";
import { ServerApplicationComponent, ServerApplicationComponentProps } from "../component";
import { WebSocketRoute } from "./route";
export declare type ServerWebSocketApplicationOptions = Omit<ws.ServerOptions, "host" | "port" | "server" | "path" | "noServer"> & {
    contextCreationTimeout: number;
    pingPongCheckInterval: number;
};
declare type WebSocketUpgradeEventHandler = (req: Readonly<http.IncomingMessage> | Readonly<http2.Http2ServerRequest>, socket: net.Socket, head: Buffer) => void;
export declare class ServerWebSocketApplication extends ServerApplicationComponent<WebSocketRoute> {
    static readonly key = "ws";
    readonly Route: typeof WebSocketRoute;
    readonly module: ws.Server & {
        upgradeEventHandler: WebSocketUpgradeEventHandler;
    };
    private readonly opts;
    private readonly routeHandlerConnectionHandlersMap;
    private pingPongCheckIntervalTimer?;
    constructor(props: ServerApplicationComponentProps, opts?: RecursivePartial<ServerWebSocketApplicationOptions>);
    start(): Promise<void>;
    stop(): Promise<void>;
    mountRoutes(routes: ReadonlyArray<Readonly<WebSocketRoute>>, pathPrefixes: string[], createContext: APIRequestContextConstructor): Readonly<RouteHandlerMap<WebSocketRoute>>;
    unmountRoutes(routeHandlerMap: Readonly<RouteHandlerMap<WebSocketRoute>>): void;
}
export {};

import { ServerOptions as SubscriptionServerOptions } from "subscriptions-transport-ws";
import * as WebSocket from "ws";
import { WebSocketRouteHandler } from "../../../../../server";
export declare class GraphQLSubscriptionHandler {
    readonly handler: WebSocketRouteHandler;
    private onOperation?;
    private onOperationComplete?;
    private onConnect?;
    private onDisconnect?;
    private keepAlive?;
    private execute?;
    private subscribe?;
    private schema?;
    private rootValue?;
    private closeHandler?;
    private specifiedRules;
    constructor(options: SubscriptionServerOptions);
    close(): void;
    readonly server: WebSocket.Server;
    private loadExecutor;
    private unsubscribe;
    private onClose;
    private onMessage;
    private sendKeepAlive;
    private sendMessage;
    private sendError;
}

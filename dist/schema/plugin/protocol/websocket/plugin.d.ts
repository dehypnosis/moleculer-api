import { RecursivePartial, ValidationError } from "../../../../interface";
import { Branch } from "../../../branch";
import { ServiceAPIIntegration } from "../../../integration";
import { Route } from "../../../../server";
import { ProtocolPlugin, ProtocolPluginProps } from "../plugin";
import { WebSocketProtocolPluginSchema, WebSocketProtocolPluginCatalog } from "./schema";
export declare type WebSocketProtocolPluginOptions = {};
export declare class WebSocketProtocolPlugin extends ProtocolPlugin<WebSocketProtocolPluginSchema, WebSocketProtocolPluginCatalog> {
    protected readonly props: ProtocolPluginProps;
    static readonly key = "WebSocket";
    static readonly autoLoadOptions: WebSocketProtocolPluginOptions;
    private opts;
    constructor(props: ProtocolPluginProps, opts?: RecursivePartial<WebSocketProtocolPluginOptions>);
    start(): Promise<void>;
    stop(): Promise<void>;
    validateSchema(schema: WebSocketProtocolPluginSchema): ValidationError[];
    compileSchemata(routeHashMapCache: Readonly<Map<string, Readonly<Route>>>, integrations: Readonly<ServiceAPIIntegration>[], branch: Branch): {
        hash: string;
        route: Readonly<Route>;
    }[];
    private createRouteFromWebSocketPubSubRouteScheme;
    private createRouteFromWebSocketStreamingRouteScheme;
    describeSchema(schema: Readonly<WebSocketProtocolPluginSchema>): WebSocketProtocolPluginCatalog;
}

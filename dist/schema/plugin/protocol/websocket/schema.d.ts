import { CallConnectorSchema, ConnectorCatalog, PublishConnectorSchema, SubscribeConnectorSchema } from "../../connector";
import { IProtocolPluginSchema, IProtocolPluginCatalog } from "../plugin";
export declare type WebSocketProtocolPluginSchema = IProtocolPluginSchema & {
    description: string;
    basePath: string;
    routes: WebSocketRouteSchema[];
};
export declare type WebSocketRouteSchema = {
    path: string;
    description?: string;
    deprecated?: boolean;
} & (WebSocketPubSubRouteSchema | WebSocketStreamingRouteSchema);
export declare type WebSocketPubSubRouteSchema = {
    subscribe: SubscribeConnectorSchema;
    publish: PublishConnectorSchema;
    ignoreError?: boolean;
};
export declare type WebSocketStreamingRouteSchema = {
    call: CallConnectorSchema;
};
export declare type WebSocketProtocolPluginCatalog = IProtocolPluginCatalog & {
    schema: WebSocketProtocolPluginSchema;
    description: string;
    entries: {
        path: string;
        description: string | null;
        deprecated: boolean;
        connector: ConnectorCatalog;
    }[];
};

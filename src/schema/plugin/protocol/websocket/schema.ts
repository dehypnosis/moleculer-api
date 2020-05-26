import { CallConnectorSchema, ConnectorCatalog, PublishConnectorSchema, SubscribeConnectorSchema } from "../../connector";
import { IProtocolPluginSchema, IProtocolPluginCatalog } from "../plugin";

/* WebSocket Protocol Plugin */
export type WebSocketProtocolPluginSchema = IProtocolPluginSchema & {
  description?: string;
  basePath: string;
  routes: WebSocketRouteSchema[];
};

export type WebSocketRouteSchema = {
  path: string;
  description?: string;
  deprecated?: boolean;
} & (WebSocketPubSubRouteSchema | WebSocketStreamingRouteSchema);

export type WebSocketPubSubRouteSchema = {
  subscribe: SubscribeConnectorSchema;
  publish: PublishConnectorSchema;
  ignoreError?: boolean;
};

export type WebSocketStreamingRouteSchema = {
  call: CallConnectorSchema;
  // binary?: boolean;
};

export type WebSocketProtocolPluginCatalog = IProtocolPluginCatalog & {
  schema: WebSocketProtocolPluginSchema;
  description: string | null;
  entries: {
    path: string;
    description: string | null;
    deprecated: boolean;
    connector: ConnectorCatalog;
  }[];
};

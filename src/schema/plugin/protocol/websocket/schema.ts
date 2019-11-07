import { ConnectorCatalog, PublishConnectorSchema, SubscribeConnectorSchema } from "../../connector";
import { IProtocolPluginSchema, IProtocolPluginCatalog } from "../plugin";

/* WebSocket Protocol Plugin */
export type WebSocketProtocolPluginSchema = IProtocolPluginSchema & {
  description: string;
  basePath: string;
  routes: WebSocketRouteSchema[];
};

export type WebSocketRouteSchema = {
  path: string;
  description?: string;
  deprecated?: boolean;
  subscribe: SubscribeConnectorSchema;
  publish: PublishConnectorSchema;
  ignoreError?: boolean;
};

export type WebSocketProtocolPluginCatalog = IProtocolPluginCatalog & {
  schema: WebSocketProtocolPluginSchema;
  description: string;
  entries: Array<{
    path: string;
    description: string | null;
    deprecated: boolean;
    connector: ConnectorCatalog;
  }>;
};

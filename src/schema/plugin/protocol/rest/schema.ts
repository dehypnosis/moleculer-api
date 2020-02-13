import { CallConnectorSchema, ConnectorCatalog, MapConnectorSchema, PublishConnectorSchema } from "../../connector/schema";
import { IProtocolPluginSchema, IProtocolPluginCatalog } from "../plugin";

/* REST Protocol Plugin */
export type RESTProtocolPluginSchema = IProtocolPluginSchema & {
  description: string;
  basePath: string;
  routes: RESTRouteSchema[];
};

export type RESTRouteSchema = {
  path: string;
  description?: string;
  deprecated?: boolean;
} & (
  ({ method: "GET"; } & (RESTCallableRouteResolverSchema | RESTMappableRouteResolverSchema))
  | ({ method: "POST" | "PUT" | "PATCH" | "DELETE"; } & (Omit<RESTCallableRouteResolverSchema, "ignoreError"> | RESTPublishableRouteResolverSchema))
);

export type RESTRouteResolverSchema = RESTCallableRouteResolverSchema | RESTPublishableRouteResolverSchema | RESTMappableRouteResolverSchema;
export type RESTCallableRouteResolverSchema = { call: CallConnectorSchema; ignoreError?: boolean; };
export type RESTPublishableRouteResolverSchema = { publish: PublishConnectorSchema; };
export type RESTMappableRouteResolverSchema = { map: MapConnectorSchema<(obj: { path: any, query: any, body: any, context: any }) => any>; };

export type RESTProtocolPluginCatalog = IProtocolPluginCatalog & {
  schema: RESTProtocolPluginSchema;
  description: string;
  entries: {
    path: string;
    method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
    description: string | null;
    deprecated: boolean;
    connector: ConnectorCatalog;
  }[];
};

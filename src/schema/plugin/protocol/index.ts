/* plugins */
import { RecursivePartial } from "../../../interface";
import { ProtocolPlugin } from "./plugin";
import { GraphQLProtocolPlugin, GraphQLProtocolPluginOptions } from "./graphql";
import { RESTProtocolPlugin, RESTProtocolPluginOptions } from "./rest";
import { WebSocketProtocolPlugin, WebSocketProtocolPluginOptions } from "./websocket";

export * from "./plugin";
export * from "./graphql";
export * from "./rest";
export * from "./websocket";

export const ProtocolPluginConstructors = {
  [GraphQLProtocolPlugin.key]: GraphQLProtocolPlugin,
  [RESTProtocolPlugin.key]: RESTProtocolPlugin,
  [WebSocketProtocolPlugin.key]: WebSocketProtocolPlugin,
};

export type ProtocolPluginConstructorOptions = {
  [GraphQLProtocolPlugin.key]: RecursivePartial<GraphQLProtocolPluginOptions> | false,
  [RESTProtocolPlugin.key]: RecursivePartial<RESTProtocolPluginOptions> | false,
  [WebSocketProtocolPlugin.key]: RecursivePartial<WebSocketProtocolPluginOptions> | false,
};

export const defaultProtocolPluginConstructorOptions: ProtocolPluginConstructorOptions = {
  [GraphQLProtocolPlugin.key]: GraphQLProtocolPlugin.autoLoadOptions,
  [RESTProtocolPlugin.key]: RESTProtocolPlugin.autoLoadOptions,
  [WebSocketProtocolPlugin.key]: WebSocketProtocolPlugin.autoLoadOptions,
};

export type ProtocolSchema = { [key in keyof (typeof ProtocolPluginConstructors)]?: InstanceType<(typeof ProtocolPluginConstructors)[key]> extends ProtocolPlugin<infer Schema, any> ? Schema : never };

export type ProtocolCatalog = { [key in keyof (typeof ProtocolPluginConstructors)]?: InstanceType<(typeof ProtocolPluginConstructors)[key]> extends ProtocolPlugin<any, infer Catalog> ? Catalog : never };

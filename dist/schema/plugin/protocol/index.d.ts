import { RecursivePartial } from "../../../interface";
import { ProtocolPlugin } from "./plugin";
import { GraphQLProtocolPlugin, GraphQLProtocolPluginOptions } from "./graphql";
import { RESTProtocolPlugin, RESTProtocolPluginOptions } from "./rest";
import { WebSocketProtocolPlugin, WebSocketProtocolPluginOptions } from "./websocket";
export * from "./plugin";
export * from "./graphql";
export * from "./rest";
export * from "./websocket";
export declare const ProtocolPluginConstructors: {
    GraphQL: typeof GraphQLProtocolPlugin;
    REST: typeof RESTProtocolPlugin;
    WebSocket: typeof WebSocketProtocolPlugin;
};
export declare type ProtocolPluginConstructorOptions = {
    [GraphQLProtocolPlugin.key]: RecursivePartial<GraphQLProtocolPluginOptions> | false;
    [RESTProtocolPlugin.key]: RecursivePartial<RESTProtocolPluginOptions> | false;
    [WebSocketProtocolPlugin.key]: RecursivePartial<WebSocketProtocolPluginOptions> | false;
};
export declare const defaultProtocolPluginConstructorOptions: ProtocolPluginConstructorOptions;
export declare type ProtocolSchema = {
    [key in keyof (typeof ProtocolPluginConstructors)]?: InstanceType<(typeof ProtocolPluginConstructors)[key]> extends ProtocolPlugin<infer Schema, any> ? Schema : never;
};
export declare type ProtocolCatalog = {
    [key in keyof (typeof ProtocolPluginConstructors)]?: InstanceType<(typeof ProtocolPluginConstructors)[key]> extends ProtocolPlugin<any, infer Catalog> ? Catalog : never;
};

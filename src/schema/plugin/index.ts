import { RecursivePartial } from "../../interface";
import { FilterPolicyPlugin, FilterPolicyPluginOptions } from "./policy/filter/plugin";
import { ScopesPolicyPlugin, ScopesPolicyPluginOptions } from "./policy/scopes/plugin";
import { GraphQLProtocolPlugin, GraphQLProtocolPluginOptions } from "./protocol/graphql/plugin";
import { RESTProtocolPlugin, RESTProtocolPluginOptions } from "./protocol/rest/plugin";
import { WebSocketProtocolPlugin, WebSocketProtocolPluginOptions } from "./protocol/websocket/plugin";
import { ProtocolPlugin } from "./protocol/plugin";
import { PolicyPlugin } from "./policy/plugin";

export { ProtocolPlugin, PolicyPlugin };
export { PolicySchema } from "./connector/schema";

/* plugins */
type ProtocolPluginClass = typeof ProtocolPlugin;

interface ProtocolPluginInterface extends ProtocolPluginClass {
}

type PolicyPluginClass = typeof PolicyPlugin;

interface PolicyPluginInterface extends PolicyPluginClass {
}

export const pluginConstructors: {
  protocol: { [plugin: string]: ProtocolPluginInterface };
  policy: { [plugin: string]: PolicyPluginInterface };
} = {
  protocol: {
    [GraphQLProtocolPlugin.key]: GraphQLProtocolPlugin as ProtocolPluginInterface,
    [RESTProtocolPlugin.key]: RESTProtocolPlugin as ProtocolPluginInterface,
    [WebSocketProtocolPlugin.key]: WebSocketProtocolPlugin as ProtocolPluginInterface,
  },
  policy: {
    [FilterPolicyPlugin.key]: FilterPolicyPlugin as PolicyPluginInterface,
    [ScopesPolicyPlugin.key]: ScopesPolicyPlugin as PolicyPluginInterface,
  },
};

export type PluginConstructorOptions = {
  protocol: {
    [GraphQLProtocolPlugin.key]: RecursivePartial<GraphQLProtocolPluginOptions> | false,
    [RESTProtocolPlugin.key]: RecursivePartial<RESTProtocolPluginOptions> | false,
    [WebSocketProtocolPlugin.key]: RecursivePartial<WebSocketProtocolPluginOptions> | false,
  },
  policy: {
    [FilterPolicyPlugin.key]: RecursivePartial<FilterPolicyPluginOptions> | false,
    [ScopesPolicyPlugin.key]: RecursivePartial<ScopesPolicyPluginOptions> | false,
  },
};

export const defaultPluginConstructorOptions: PluginConstructorOptions = {
  protocol: {
    [GraphQLProtocolPlugin.key]: GraphQLProtocolPlugin.autoLoadOptions,
    [RESTProtocolPlugin.key]: RESTProtocolPlugin.autoLoadOptions,
    [WebSocketProtocolPlugin.key]: WebSocketProtocolPlugin.autoLoadOptions,
  },
  policy: {
    [FilterPolicyPlugin.key]: FilterPolicyPlugin.autoLoadOptions,
    [ScopesPolicyPlugin.key]: ScopesPolicyPlugin.autoLoadOptions,
  },
};

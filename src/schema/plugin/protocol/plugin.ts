import { ServiceAPIIntegration } from "../../integration";
import { Route } from "../../../server";
import { Plugin, PluginProps } from "../plugin";
import { PolicyPlugin } from "../policy";

export interface IProtocolPluginCatalog {
  schema: any;
  description: string;
  entries: any[];
}

export interface IProtocolPluginSchema {
  description: string;
}

export type ProtocolPluginProps = PluginProps & {
  policyPlugins: Array<Readonly<PolicyPlugin<any, any>>>;
};

export abstract class ProtocolPlugin<PluginSchema extends IProtocolPluginSchema, PluginCatalog extends IProtocolPluginCatalog> extends Plugin<PluginSchema, PluginCatalog> {
  constructor(protected readonly props: ProtocolPluginProps, opts?: any) {
    super(props);
  }

  /* Schema integration and route generation */
  public abstract compileSchemata(routeHashMapCache: Readonly<Map<string, Readonly<Route>>>, integrations: Array<Readonly<ServiceAPIIntegration>>): Array<{ hash: string, route: Readonly<Route> }>;
}

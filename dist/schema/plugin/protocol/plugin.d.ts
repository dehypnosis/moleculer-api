import { ServiceAPIIntegration } from "../../integration";
import { Route } from "../../../server";
import { Plugin, PluginProps } from "../plugin";
import { PolicyPlugin } from "../policy";
export interface IProtocolPluginCatalog {
    schema: any;
    description?: string;
    entries: any[];
}
export interface IProtocolPluginSchema {
    description?: string;
}
export declare type ProtocolPluginProps = PluginProps & {
    policyPlugins: Readonly<PolicyPlugin<any, any>>[];
};
export declare abstract class ProtocolPlugin<PluginSchema extends IProtocolPluginSchema, PluginCatalog extends IProtocolPluginCatalog> extends Plugin<PluginSchema, PluginCatalog> {
    protected readonly props: ProtocolPluginProps;
    constructor(props: ProtocolPluginProps, opts?: any);
    abstract compileSchemata(routeHashMapCache: Readonly<Map<string, Readonly<Route>>>, integrations: Readonly<ServiceAPIIntegration>[]): {
        hash: string;
        route: Readonly<Route>;
    }[];
}

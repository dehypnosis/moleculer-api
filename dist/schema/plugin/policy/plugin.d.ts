import { ServiceAPIIntegration } from "../../integration";
import { Plugin, PluginProps } from "../plugin";
import { CallPolicyArgs, PublishPolicyArgs, SubscribePolicyArgs } from "../connector";
export interface IPolicyPluginCatalog {
    type: string;
    description: string | null;
}
export interface IPolicyPluginSchema {
}
export declare type PolicyPluginProps = PluginProps;
export declare type CallPolicyTester = (args: Readonly<CallPolicyArgs>) => boolean;
export declare type PublishPolicyTester = (args: Readonly<PublishPolicyArgs>) => boolean;
export declare type SubscribePolicyTester = (args: Readonly<SubscribePolicyArgs>) => boolean;
export declare abstract class PolicyPlugin<PluginSchema extends IPolicyPluginSchema, PluginCatalog extends IPolicyPluginCatalog> extends Plugin<PluginSchema, PluginCatalog> {
    abstract compileCallPolicySchemata(schemata: ReadonlyArray<PluginSchema>, descriptions: ReadonlyArray<string | null>, integration: Readonly<ServiceAPIIntegration>): CallPolicyTester;
    abstract compilePublishPolicySchemata(schemata: ReadonlyArray<PluginSchema>, descriptions: ReadonlyArray<string | null>, integration: Readonly<ServiceAPIIntegration>): PublishPolicyTester;
    abstract compileSubscribePolicySchemata(schemata: ReadonlyArray<PluginSchema>, descriptions: ReadonlyArray<string | null>, integration: Readonly<ServiceAPIIntegration>): SubscribePolicyTester;
}

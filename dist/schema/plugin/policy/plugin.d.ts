import { Plugin, PluginProps } from "../plugin";
import { CallPolicyArgs, PublishPolicyArgs, SubscribePolicyArgs } from "../connector";
export interface IPolicyPluginCatalog {
    type: string;
    description: string | null;
}
export interface IPolicyPluginSchema {
}
export declare type PolicyPluginProps = PluginProps;
export declare abstract class PolicyPlugin<PluginSchema extends IPolicyPluginSchema, PluginCatalog extends IPolicyPluginCatalog> extends Plugin<PluginSchema, PluginCatalog> {
    abstract testCallPolicy(schema: Readonly<PluginSchema>, args: Readonly<CallPolicyArgs>): boolean | any;
    abstract testPublishPolicy(schema: Readonly<PluginSchema>, args: Readonly<PublishPolicyArgs>): boolean | any;
    abstract testSubscribePolicy(schema: Readonly<PluginSchema>, args: Readonly<SubscribePolicyArgs>): boolean | any;
}

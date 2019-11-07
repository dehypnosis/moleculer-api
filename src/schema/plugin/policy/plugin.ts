import { Plugin, PluginProps } from "../plugin";
import { CallPolicyArgs, PublishPolicyArgs, SubscribePolicyArgs } from "../connector";

export interface IPolicyPluginCatalog {
  type: string;
  description: string | null;
}

export interface IPolicyPluginSchema {
}

export type PolicyPluginProps = PluginProps;

export abstract class PolicyPlugin<PluginSchema extends IPolicyPluginSchema, PluginCatalog extends IPolicyPluginCatalog> extends Plugin<PluginSchema, PluginCatalog> {
  public abstract testCallPolicy(schema: Readonly<PluginSchema>, args: Readonly<CallPolicyArgs>): boolean | any;

  public abstract testPublishPolicy(schema: Readonly<PluginSchema>, args: Readonly<PublishPolicyArgs>): boolean | any;

  public abstract testSubscribePolicy(schema: Readonly<PluginSchema>, args: Readonly<SubscribePolicyArgs>): boolean | any;
}

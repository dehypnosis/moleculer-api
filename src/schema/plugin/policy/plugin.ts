import { Plugin, PluginProps } from "../plugin";
import { CallPolicyArgs, PolicyPluginCatalog, PublishPolicyArgs, SubscribePolicyArgs } from "../connector/schema";

export type PolicyPluginProps = PluginProps;
export abstract class PolicyPlugin<PluginSchema, PluginCatalog extends PolicyPluginCatalog> extends Plugin<PluginSchema, PluginCatalog> {
  public abstract testCallPolicy(schema: Readonly<PluginSchema>, args: Readonly<CallPolicyArgs>): boolean | any;
  public abstract testPublishPolicy(schema: Readonly<PluginSchema>, args: Readonly<PublishPolicyArgs>): boolean | any;
  public abstract testSubscribePolicy(schema: Readonly<PluginSchema>, args: Readonly<SubscribePolicyArgs>): boolean | any;
}

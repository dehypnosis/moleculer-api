import { ServiceAPIIntegration } from "../../integration";
import { Plugin, PluginProps } from "../plugin";
import { CallPolicyArgs, PublishPolicyArgs, SubscribePolicyArgs } from "../connector";

export interface IPolicyPluginCatalog {
  type: string;
  description: string | null;
}

export interface IPolicyPluginSchema {
}

export type PolicyPluginProps = PluginProps;

export type CallPolicyTester = (args: Readonly<CallPolicyArgs>) => boolean;
export type PublishPolicyTester = (args: Readonly<PublishPolicyArgs>) => boolean;
export type SubscribePolicyTester = (args: Readonly<SubscribePolicyArgs>) => boolean;

export abstract class PolicyPlugin<PluginSchema extends IPolicyPluginSchema, PluginCatalog extends IPolicyPluginCatalog> extends Plugin<PluginSchema, PluginCatalog> {
  public abstract compileCallPolicySchema(schema: Readonly<PluginSchema>, integration: Readonly<ServiceAPIIntegration>): CallPolicyTester;
  public abstract compilePublishPolicySchema(schema: Readonly<PluginSchema>, integration: Readonly<ServiceAPIIntegration>): PublishPolicyTester;
  public abstract compileSubscribePolicySchema(schema: Readonly<PluginSchema>, integration: Readonly<ServiceAPIIntegration>): SubscribePolicyTester;
}

import { PolicyPlugin } from "..";
import { CallPolicyArgs, CallPolicySchema, PublishPolicyArgs, PublishPolicySchema, SubscribePolicyArgs, SubscribePolicySchema } from "./schema";

export function testCallPolicy(policyPlugins: ReadonlyArray<Readonly<PolicyPlugin<any, any>>>, policies: ReadonlyArray<Readonly<CallPolicySchema>>, args: Readonly<CallPolicyArgs>): boolean | any {
  for (const policy of policies) {
    for (const plugin of policyPlugins) {
      const pluginSchema = policy[plugin.key];
      if (!pluginSchema) {
        continue;
      }
      const result = plugin.testCallPolicy(pluginSchema, args);
      if (result === false || result !== true) {
        return result;
      }
    }
  }
  return true;
}

export function testPublishPolicy(policyPlugins: ReadonlyArray<Readonly<PolicyPlugin<any, any>>>, policies: ReadonlyArray<Readonly<PublishPolicySchema>>, args: Readonly<PublishPolicyArgs>): boolean | any {
  for (const policy of policies) {
    for (const plugin of policyPlugins) {
      const pluginSchema = policy[plugin.key];
      if (!pluginSchema) {
        continue;
      }
      const result = plugin.testPublishPolicy(pluginSchema, args);
      if (result === false || result !== true) {
        return result;
      }
    }
  }
  return true;
}

export function testSubscribePolicy(policyPlugins: ReadonlyArray<Readonly<PolicyPlugin<any, any>>>, policies: ReadonlyArray<Readonly<SubscribePolicySchema>>, args: Readonly<SubscribePolicyArgs>): boolean | any {
  for (const policy of policies) {
    for (const plugin of policyPlugins) {
      const pluginSchema = policy[plugin.key];
      if (!pluginSchema) {
        continue;
      }
      const result = plugin.testSubscribePolicy(pluginSchema, args);
      if (result === false || result !== true) {
        return result;
      }
    }
  }
  return true;
}

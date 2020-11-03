import { ServiceAPIIntegration } from "../../integration";
import { CallPolicyTester, PolicyPlugin, PublishPolicyTester, SubscribePolicyTester } from "../policy";
import { CallPolicySchema, PublishPolicySchema, SubscribePolicySchema } from "./schema";

export const PolicyCompiler = {
  call<MappableArgs extends { [key: string]: any }>(
    policySchemata: ReadonlyArray<Readonly<CallPolicySchema>>,
    policyPlugins: ReadonlyArray<Readonly<PolicyPlugin<any, any>>>,
    integration: Readonly<ServiceAPIIntegration>,
    opts: {},
  ): CallPolicyTester {
    const testers: CallPolicyTester[] = [];
    for (const policy of policySchemata) {
      for (const plugin of policyPlugins) {
        const pluginSchema = policy[plugin.key];
        if (!pluginSchema) {
          continue;
        }
        testers.push(plugin.compileCallPolicySchema(pluginSchema, integration));
      }
    }
    return (args) => {
      for (const tester of testers) {
        if (!tester(args)) {
          return false;
        }
      }
      return true;
    };
  },

  publish<MappableArgs extends { [key: string]: any }>(
    policySchemata: ReadonlyArray<Readonly<PublishPolicySchema>>,
    policyPlugins: ReadonlyArray<Readonly<PolicyPlugin<any, any>>>,
    integration: Readonly<ServiceAPIIntegration>,
    opts: {},
  ): PublishPolicyTester {
    const testers: PublishPolicyTester[] = [];
    for (const policy of policySchemata) {
      for (const plugin of policyPlugins) {
        const pluginSchema = policy[plugin.key];
        if (!pluginSchema) {
          continue;
        }
        testers.push(plugin.compilePublishPolicySchema(pluginSchema, integration));
      }
    }
    return (args) => {
      for (const tester of testers) {
        if (!tester(args)) {
          return false;
        }
      }
      return true;
    };
  },

  subscribe<MappableArgs extends { [key: string]: any }>(
    policySchemata: ReadonlyArray<Readonly<SubscribePolicySchema>>,
    policyPlugins: ReadonlyArray<Readonly<PolicyPlugin<any, any>>>,
    integration: Readonly<ServiceAPIIntegration>,
    opts: {},
  ): SubscribePolicyTester {
    const testers: SubscribePolicyTester[] = [];
    for (const policy of policySchemata) {
      for (const plugin of policyPlugins) {
        const pluginSchema = policy[plugin.key];
        if (!pluginSchema) {
          continue;
        }
        testers.push(plugin.compileSubscribePolicySchema(pluginSchema, integration));
      }
    }
    return (args) => {
      for (const tester of testers) {
        if (!tester(args)) {
          return false;
        }
      }
      return true;
    };
  },
};

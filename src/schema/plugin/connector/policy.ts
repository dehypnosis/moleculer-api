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
    const testers: CallPolicyTester[] = policyPlugins
      .map(plugin => {
        const matchedList = policySchemata.filter(s => typeof s[plugin.key] !== "undefined").map(s => [s[plugin.key], s.description || null]);
        if (!matchedList.length) {
          return null as any;
        }
        const schemata = matchedList.map(m => m[0]);
        const descriptions = matchedList.map(m => m[1]);
        return plugin.compileCallPolicySchemata(schemata, descriptions, integration);
      })
      .filter(fn => !!fn);
    return (args) => testers.every(tester => tester(args));
  },

  publish<MappableArgs extends { [key: string]: any }>(
    policySchemata: ReadonlyArray<Readonly<PublishPolicySchema>>,
    policyPlugins: ReadonlyArray<Readonly<PolicyPlugin<any, any>>>,
    integration: Readonly<ServiceAPIIntegration>,
    opts: {},
  ): PublishPolicyTester {
    const testers: PublishPolicyTester[] = policyPlugins
      .map(plugin => {
        const matchedList = policySchemata.filter(s => typeof s[plugin.key] !== "undefined").map(s => [s[plugin.key], s.description || null]);
        if (!matchedList.length) {
          return null as any;
        }
        const schemata = matchedList.map(m => m[0]);
        const descriptions = matchedList.map(m => m[1]);
        return plugin.compilePublishPolicySchemata(schemata, descriptions, integration);
      })
      .filter(fn => !!fn);
    return (args) => testers.every(tester => tester(args));
  },

  subscribe<MappableArgs extends { [key: string]: any }>(
    policySchemata: ReadonlyArray<Readonly<SubscribePolicySchema>>,
    policyPlugins: ReadonlyArray<Readonly<PolicyPlugin<any, any>>>,
    integration: Readonly<ServiceAPIIntegration>,
    opts: {},
  ): SubscribePolicyTester {
    const testers: SubscribePolicyTester[] = policyPlugins
      .map(plugin => {
        const matchedList = policySchemata.filter(s => typeof s[plugin.key] !== "undefined").map(s => [s[plugin.key], s.description || null]);
        if (!matchedList.length) {
          return null as any;
        }
        const schemata = matchedList.map(m => m[0]);
        const descriptions = matchedList.map(m => m[1]);
        return plugin.compileSubscribePolicySchemata(schemata, descriptions, integration);
      })
      .filter(fn => !!fn);
    return (args) => testers.every(tester => tester(args));
  },
};

import { ServiceAPIIntegration } from "../../integration";
import { CallPolicyTester, PolicyPlugin, PublishPolicyTester, SubscribePolicyTester } from "../policy";
import { CallPolicySchema, PublishPolicySchema, SubscribePolicySchema } from "./schema";
export declare const PolicyCompiler: {
    call<MappableArgs extends {
        [key: string]: any;
    }>(policySchemata: ReadonlyArray<Readonly<CallPolicySchema>>, policyPlugins: ReadonlyArray<Readonly<PolicyPlugin<any, any>>>, integration: Readonly<ServiceAPIIntegration>, opts: {}): CallPolicyTester;
    publish<MappableArgs_1 extends {
        [key: string]: any;
    }>(policySchemata: ReadonlyArray<Readonly<PublishPolicySchema>>, policyPlugins: ReadonlyArray<Readonly<PolicyPlugin<any, any>>>, integration: Readonly<ServiceAPIIntegration>, opts: {}): PublishPolicyTester;
    subscribe<MappableArgs_2 extends {
        [key: string]: any;
    }>(policySchemata: ReadonlyArray<Readonly<SubscribePolicySchema>>, policyPlugins: ReadonlyArray<Readonly<PolicyPlugin<any, any>>>, integration: Readonly<ServiceAPIIntegration>, opts: {}): SubscribePolicyTester;
};

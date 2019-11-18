import { PolicyPlugin } from "..";
import { CallPolicyArgs, CallPolicySchema, PublishPolicyArgs, PublishPolicySchema, SubscribePolicyArgs, SubscribePolicySchema } from "./schema";
export declare function testCallPolicy(policyPlugins: ReadonlyArray<Readonly<PolicyPlugin<any, any>>>, policies: ReadonlyArray<Readonly<CallPolicySchema>>, args: Readonly<CallPolicyArgs>): boolean | any;
export declare function testPublishPolicy(policyPlugins: ReadonlyArray<Readonly<PolicyPlugin<any, any>>>, policies: ReadonlyArray<Readonly<PublishPolicySchema>>, args: Readonly<PublishPolicyArgs>): boolean | any;
export declare function testSubscribePolicy(policyPlugins: ReadonlyArray<Readonly<PolicyPlugin<any, any>>>, policies: ReadonlyArray<Readonly<SubscribePolicySchema>>, args: Readonly<SubscribePolicyArgs>): boolean | any;

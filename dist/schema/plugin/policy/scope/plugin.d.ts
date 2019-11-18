import { RecursivePartial, ValidationError } from "../../../../interface";
import { CallPolicyArgs, PublishPolicyArgs, SubscribePolicyArgs } from "../../connector";
import { PolicyPlugin, PolicyPluginProps } from "../plugin";
import { ScopePolicyPluginCatalog, ScopePolicyPluginSchema } from "./schema";
export declare type ScopePolicyPluginOptions = {};
export declare class ScopePolicyPlugin extends PolicyPlugin<ScopePolicyPluginSchema, ScopePolicyPluginCatalog> {
    protected readonly props: PolicyPluginProps;
    static readonly key = "scope";
    static readonly autoLoadOptions = false;
    private opts;
    constructor(props: PolicyPluginProps, opts?: RecursivePartial<ScopePolicyPluginOptions>);
    validateSchema(schema: Readonly<ScopePolicyPluginSchema>): ValidationError[];
    start(): Promise<void>;
    stop(): Promise<void>;
    describeSchema(schema: Readonly<ScopePolicyPluginSchema>): ScopePolicyPluginCatalog;
    testCallPolicy(schema: ScopePolicyPluginSchema, args: Readonly<CallPolicyArgs>): true | any;
    testPublishPolicy(schema: ScopePolicyPluginSchema, args: Readonly<PublishPolicyArgs>): true | any;
    testSubscribePolicy(schema: ScopePolicyPluginSchema, args: Readonly<SubscribePolicyArgs>): true | any;
}

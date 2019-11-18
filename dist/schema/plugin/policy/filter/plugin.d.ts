import { RecursivePartial, ValidationError } from "../../../../interface";
import { CallPolicyArgs, PublishPolicyArgs, SubscribePolicyArgs } from "../../connector";
import { PolicyPlugin, PolicyPluginProps } from "../plugin";
import { FilterPolicyPluginSchema, FilterPolicyPluginCatalog } from "./schema";
export declare type FilterPolicyPluginOptions = {};
export declare class FilterPolicyPlugin extends PolicyPlugin<FilterPolicyPluginSchema, FilterPolicyPluginCatalog> {
    protected readonly props: PolicyPluginProps;
    static readonly key = "filter";
    static readonly autoLoadOptions: FilterPolicyPluginOptions;
    private readonly opts;
    constructor(props: PolicyPluginProps, opts?: RecursivePartial<FilterPolicyPluginOptions>);
    validateSchema(schema: Readonly<FilterPolicyPluginSchema>): ValidationError[];
    start(): Promise<void>;
    stop(): Promise<void>;
    describeSchema(schema: Readonly<FilterPolicyPluginSchema>): FilterPolicyPluginCatalog;
    testCallPolicy(schema: Readonly<FilterPolicyPluginSchema>, args: Readonly<CallPolicyArgs>): boolean | any;
    testPublishPolicy(schema: Readonly<FilterPolicyPluginSchema>, args: Readonly<PublishPolicyArgs>): boolean | any;
    testSubscribePolicy(schema: Readonly<FilterPolicyPluginSchema>, args: Readonly<SubscribePolicyArgs>): boolean;
}

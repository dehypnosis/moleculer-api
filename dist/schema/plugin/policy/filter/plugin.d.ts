import { RecursivePartial, ValidationError } from "../../../../interface";
import { ServiceAPIIntegration } from "../../../integration";
import { CallPolicyTester, PolicyPlugin, PolicyPluginProps, PublishPolicyTester, SubscribePolicyTester } from "../plugin";
import { FilterPolicyPluginSchema, FilterPolicyPluginCatalog } from "./schema";
export declare type FilterPolicyPluginOptions = {
    showOriginalError: boolean;
};
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
    compileCallPolicySchemata(schemata: ReadonlyArray<FilterPolicyPluginSchema>, descriptions: ReadonlyArray<string | null>, integration: Readonly<ServiceAPIIntegration>): CallPolicyTester;
    compilePublishPolicySchemata(schemata: ReadonlyArray<FilterPolicyPluginSchema>, descriptions: ReadonlyArray<string | null>, integration: Readonly<ServiceAPIIntegration>): PublishPolicyTester;
    compileSubscribePolicySchemata(schemata: ReadonlyArray<FilterPolicyPluginSchema>, descriptions: ReadonlyArray<string | null>, integration: Readonly<ServiceAPIIntegration>): SubscribePolicyTester;
    private compilePolicySchemata;
}

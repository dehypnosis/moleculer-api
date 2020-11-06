import { RecursivePartial, ValidationError } from "../../../../interface";
import { ServiceAPIIntegration } from "../../../integration";
import { CallPolicyTester, PolicyPlugin, PolicyPluginProps, PublishPolicyTester, SubscribePolicyTester } from "../plugin";
import { ScopePolicyPluginCatalog, ScopePolicyPluginSchema } from "./schema";
export declare type ScopePolicyPluginOptions = {
    getScopesFromContext: (context: any) => string[];
};
export declare class ScopePolicyPlugin extends PolicyPlugin<ScopePolicyPluginSchema, ScopePolicyPluginCatalog> {
    protected readonly props: PolicyPluginProps;
    static readonly key = "scope";
    static readonly autoLoadOptions: ScopePolicyPluginOptions;
    private opts;
    constructor(props: PolicyPluginProps, opts?: RecursivePartial<ScopePolicyPluginOptions>);
    validateSchema(schema: Readonly<ScopePolicyPluginSchema>): ValidationError[];
    start(): Promise<void>;
    stop(): Promise<void>;
    describeSchema(schema: Readonly<ScopePolicyPluginSchema>): ScopePolicyPluginCatalog;
    compileCallPolicySchemata(schemata: ReadonlyArray<ScopePolicyPluginSchema>, descriptions: ReadonlyArray<string | null>, integration: Readonly<ServiceAPIIntegration>): CallPolicyTester;
    compilePublishPolicySchemata(schemata: ReadonlyArray<ScopePolicyPluginSchema>, descriptions: ReadonlyArray<string | null>, integration: Readonly<ServiceAPIIntegration>): PublishPolicyTester;
    compileSubscribePolicySchemata(schemata: ReadonlyArray<ScopePolicyPluginSchema>, descriptions: ReadonlyArray<string | null>, integration: Readonly<ServiceAPIIntegration>): SubscribePolicyTester;
    private compilePolicySchemata;
}

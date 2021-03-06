import { RecursivePartial } from "../../../interface";
import { CallPolicySchema, PublishPolicySchema, SubscribePolicySchema } from "../connector";
import { FilterPolicyPlugin, FilterPolicyPluginOptions } from "./filter";
import { ScopePolicyPlugin, ScopePolicyPluginOptions } from "./scope";
import { PolicyPlugin } from "./plugin";
export * from "./plugin";
export * from "./filter";
export * from "./scope";
export declare const PolicyPluginConstructors: {
    filter: typeof FilterPolicyPlugin;
    scope: typeof ScopePolicyPlugin;
};
export declare type PolicyPluginConstructorOptions = {
    [FilterPolicyPlugin.key]: RecursivePartial<FilterPolicyPluginOptions> | false;
    [ScopePolicyPlugin.key]: RecursivePartial<ScopePolicyPluginOptions> | false;
};
export declare const defaultPolicyPluginConstructorOptions: PolicyPluginConstructorOptions;
export declare type PolicySchemaPluginProps = {
    [key in keyof (typeof PolicyPluginConstructors)]?: InstanceType<(typeof PolicyPluginConstructors)[key]> extends PolicyPlugin<infer Schema, any> ? Schema : never;
};
export declare type PolicySchema = {
    call?: (CallPolicySchema & PolicySchemaPluginProps)[];
    publish?: (PublishPolicySchema & PolicySchemaPluginProps)[];
    subscribe?: (SubscribePolicySchema & PolicySchemaPluginProps)[];
};
export declare type PolicyCatalog = {
    [key in keyof (typeof PolicyPluginConstructors)]?: InstanceType<(typeof PolicyPluginConstructors)[key]> extends PolicyPlugin<any, infer Catalog> ? Catalog : never;
};

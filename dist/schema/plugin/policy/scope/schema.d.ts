import { IPolicyPluginCatalog, IPolicyPluginSchema } from "../plugin";
export declare type ScopePolicyPluginSchema = IPolicyPluginSchema & string[];
export declare type ScopePolicyPluginCatalog = IPolicyPluginCatalog & {
    type: string;
    description: string | null;
    scopes: ScopePolicyPluginSchema;
};

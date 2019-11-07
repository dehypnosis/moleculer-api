import { IPolicyPluginCatalog, IPolicyPluginSchema } from "../plugin";

export type ScopePolicyPluginSchema = IPolicyPluginSchema & string[];

export type ScopePolicyPluginCatalog = IPolicyPluginCatalog & {
  type: string;
  description: string | null;
  scopes: ScopePolicyPluginSchema;
};

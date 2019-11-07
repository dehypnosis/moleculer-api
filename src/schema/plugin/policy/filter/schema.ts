import { MapConnectorSchema } from "../../connector";
import { IPolicyPluginCatalog, IPolicyPluginSchema } from "../plugin";

export type FilterPolicyPluginSchema = IPolicyPluginSchema & MapConnectorSchema<(args: {[key: string]: any}) => boolean>;

export type FilterPolicyPluginCatalog = IPolicyPluginCatalog & {
  type: string;
  description: string | null;
  filter: FilterPolicyPluginSchema;
};

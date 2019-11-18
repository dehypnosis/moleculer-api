import { MapConnectorSchema } from "../../connector";
import { IPolicyPluginCatalog, IPolicyPluginSchema } from "../plugin";
export declare type FilterPolicyPluginSchema = IPolicyPluginSchema & MapConnectorSchema<(args: {
    [key: string]: any;
}) => boolean>;
export declare type FilterPolicyPluginCatalog = IPolicyPluginCatalog & {
    type: string;
    description: string | null;
    filter: FilterPolicyPluginSchema;
};

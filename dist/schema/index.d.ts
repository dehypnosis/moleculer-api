import { PolicySchema, ProtocolSchema } from "./plugin";
export { SchemaRegistry, SchemaRegistryOptions } from "./registry";
export { Branch } from "./branch";
export { Version } from "./version";
export interface ServiceMetaDataSchema {
    api?: ServiceAPISchema;
    [key: string]: any;
}
export declare type ServiceAPISchema = {
    branch: string;
    protocol: ProtocolSchema;
    policy: PolicySchema;
};

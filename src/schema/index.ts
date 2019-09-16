import { PolicySchema } from "./plugin";
export { SchemaRegistry, SchemaRegistryOptions } from "./schema";
export { Branch } from "./branch";
export { Version } from "./version";
export * from "./plugin/protocol/graphql/handler/options";

/* base Service API schema */
export type ServiceAPISchema = {
  branch: string;
  protocol: any;
  policy: PolicySchema;
};

/* derived from remote services' meta data */
export interface ServiceMetaSchema {
  api?: ServiceAPISchema;
  [key: string]: any;
}

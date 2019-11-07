import { PolicySchema, ProtocolSchema } from "./plugin";

export { SchemaRegistry, SchemaRegistryOptions } from "./registry";
export { Branch } from "./branch";
export { Version } from "./version";

/* remote services' meta data */
export interface ServiceMetaSchema {
  api?: ServiceAPISchema;

  [key: string]: any;
}

/* start from parsing given remote services' API schema */
export type ServiceAPISchema = {
  branch: string;
  protocol: ProtocolSchema;
  policy: PolicySchema;
};

/*
const example: ServiceAPISchema = {
  branch: "master",
  protocol: {
    GraphQL: {
      description: "hello world",
      typeDefs: `
        extend type Query {
          hello: String!
        }
      `,
      resolvers: {
        Query: {
          hello: `() => "world"`,
        },
      },
    },
    REST: {
      description: "...",
      basePath: "/foo",
      routes: [],
    },
    WebSocket: {
      description: "....",
      basePath: "/chat",
      routes: [],
    },
  },
  policy: {},
};
*/

import { GraphQLResolveInfo } from "graphql";
import { CallConnectorSchema, ConnectorCatalog, MapConnectorSchema, PublishConnectorSchema, SubscribeConnectorSchema } from "../../connector/schema";

/* GraphQL Protocol Plugin */
export type GraphQLProtocolPluginSchema = {
  description: string;
  typeDefs: string;
  resolvers: GraphQLProtocolResolversSchema;
};

export type GraphQLProtocolResolversSchema = {
  Query?: GraphQLProtocolQueryTypeResolverSchema;
  Mutation?: GraphQLProtocolMutationTypeResolverSchema;
  Subscription?: GraphQLProtocolSubscriptionTypeResolverSchema;
} & {
  [typeName: string]: GraphQLProtocolObjectTypeResolverSchema;
};

export type GraphQLProtocolQueryTypeResolverSchema = {
  [fieldName: string]: GraphQLCallableFieldResolverSchema | GraphQLMappableFieldResolverSchema;
};

export type GraphQLProtocolMutationTypeResolverSchema = {
  [fieldName: string]: Omit<GraphQLCallableFieldResolverSchema, "ignoreError"> | GraphQLPublishableFieldResolverSchema;
};

export type GraphQLProtocolSubscriptionTypeResolverSchema = {
  [fieldName: string]: GraphQLSubscribableFieldResolverSchema;
};

export type GraphQLProtocolObjectTypeResolverSchema = {
  __isTypeOf?: GraphQLIsTypeOfFieldResolverSchema;
} & {
  [fieldName: string]: GraphQLCallableFieldResolverSchema | GraphQLMappableFieldResolverSchema | undefined;
};

export type GraphQLFieldResolverSchema = GraphQLCallableFieldResolverSchema | GraphQLPublishableFieldResolverSchema | GraphQLSubscribableFieldResolverSchema
  | GraphQLMappableFieldResolverSchema | GraphQLIsTypeOfFieldResolverSchema | undefined;
export type GraphQLCallableFieldResolverSchema = { call: CallConnectorSchema; ignoreError?: boolean };
export type GraphQLPublishableFieldResolverSchema = { publish: PublishConnectorSchema; };
export type GraphQLSubscribableFieldResolverSchema =  { subscribe: SubscribeConnectorSchema; };
export type GraphQLMappableFieldResolverSchema = MapConnectorSchema<(obj: { source: any, args: any, info: GraphQLResolveInfo, context: any }) => any>;
export type GraphQLIsTypeOfFieldResolverSchema = MapConnectorSchema<(obj: { source: any, info: GraphQLResolveInfo, context: any }) => boolean>;

export type GraphQLProtocolPluginCatalog = {
  schema: GraphQLProtocolPluginSchema;
  description: string;
  entries: Array<{
    typeDef: string;
    kind: string;
    description: string | null;
    deprecated: boolean;
    fields: Array<{
      name: string;
      description: string | null;
      deprecated: boolean;
      connector: ConnectorCatalog;
    }> | null;
  }>;
};

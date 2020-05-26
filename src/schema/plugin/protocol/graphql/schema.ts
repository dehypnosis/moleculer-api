import { GraphQLResolveInfo } from "graphql";
export { GraphQLResolveInfo } from "graphql";
import { CallConnectorSchema, ConnectorCatalog, MapConnectorSchema, PublishConnectorSchema, SubscribeConnectorSchema } from "../../connector";
import { IProtocolPluginCatalog, IProtocolPluginSchema } from "../plugin";

/* GraphQL Protocol Plugin */
export type GraphQLProtocolPluginSchema = IProtocolPluginSchema & {
  description?: string;
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
  [fieldName: string]: GraphQLCallableFieldResolverSchema | GraphQLMappableFieldResolverSchema;
};

export type GraphQLFieldResolverSchema = GraphQLCallableFieldResolverSchema | GraphQLPublishableFieldResolverSchema | GraphQLSubscribableFieldResolverSchema
  | GraphQLMappableFieldResolverSchema | GraphQLIsTypeOfFieldResolverSchema | undefined;
export type GraphQLCallableFieldResolverSchema = { call: CallConnectorSchema; ignoreError?: boolean };
export type GraphQLPublishableFieldResolverSchema = { publish: PublishConnectorSchema; };
export type GraphQLSubscribableFieldResolverSchema =  { subscribe: SubscribeConnectorSchema; };
export type GraphQLMappableFieldResolverSchema = MapConnectorSchema<(obj: { source: any, args: any, info: GraphQLResolveInfo, context: any }) => any>;
export type GraphQLIsTypeOfFieldResolverSchema = MapConnectorSchema<(obj: { source: any, info: GraphQLResolveInfo, context: any }) => boolean>;

export type GraphQLProtocolPluginCatalog = IProtocolPluginCatalog & {
  schema: GraphQLProtocolPluginSchema;
  description: string | null;
  entries: {
    typeDef: string;
    kind: string;
    description: string | null;
    deprecated: boolean;
    fields: {
      name: string;
      description: string | null;
      deprecated: boolean;
      connector: ConnectorCatalog;
    }[] | null;
  }[];
};

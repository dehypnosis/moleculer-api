import { GraphQLResolveInfo, DocumentNode } from "graphql";
import { CallConnectorSchema, ConnectorCatalog, MapConnectorSchema, PublishConnectorSchema, SubscribeConnectorSchema } from "../../connector";
import { IProtocolPluginCatalog, IProtocolPluginSchema } from "../plugin";
export declare type GraphQLProtocolPluginSchema = IProtocolPluginSchema & {
    description?: string;
    typeDefs: string | DocumentNode;
    resolvers: GraphQLProtocolResolversSchema;
};
export declare type GraphQLProtocolResolversSchema = {
    Query?: GraphQLProtocolQueryTypeResolverSchema;
    Mutation?: GraphQLProtocolMutationTypeResolverSchema;
    Subscription?: GraphQLProtocolSubscriptionTypeResolverSchema;
} & {
    [typeName: string]: GraphQLProtocolObjectTypeResolverSchema;
};
export declare type GraphQLProtocolQueryTypeResolverSchema = {
    [fieldName: string]: GraphQLCallableFieldResolverSchema | GraphQLMappableFieldResolverSchema;
};
export declare type GraphQLProtocolMutationTypeResolverSchema = {
    [fieldName: string]: Omit<GraphQLCallableFieldResolverSchema, "ignoreError"> | GraphQLPublishableFieldResolverSchema;
};
export declare type GraphQLProtocolSubscriptionTypeResolverSchema = {
    [fieldName: string]: GraphQLSubscribableFieldResolverSchema;
};
export declare type GraphQLProtocolObjectTypeResolverSchema = {
    __isTypeOf?: GraphQLIsTypeOfFieldResolverSchema;
} & {
    [fieldName: string]: GraphQLCallableFieldResolverSchema | GraphQLMappableFieldResolverSchema;
};
export declare type GraphQLFieldResolverSchema = GraphQLCallableFieldResolverSchema | GraphQLPublishableFieldResolverSchema | GraphQLSubscribableFieldResolverSchema | GraphQLMappableFieldResolverSchema | GraphQLIsTypeOfFieldResolverSchema | undefined;
export declare type GraphQLCallableFieldResolverSchema = {
    call: CallConnectorSchema;
    ignoreError?: boolean;
};
export declare type GraphQLPublishableFieldResolverSchema = {
    publish: PublishConnectorSchema;
};
export declare type GraphQLSubscribableFieldResolverSchema = {
    subscribe: SubscribeConnectorSchema;
};
export declare type GraphQLMappableFieldResolverSchema = MapConnectorSchema<(obj: {
    source: any;
    args: any;
    info: GraphQLResolveInfo;
    context: any;
}) => any>;
export declare type GraphQLIsTypeOfFieldResolverSchema = MapConnectorSchema<(obj: {
    source: any;
    info: GraphQLResolveInfo;
    context: any;
}) => boolean>;
export declare type GraphQLProtocolPluginCatalog = IProtocolPluginCatalog & {
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

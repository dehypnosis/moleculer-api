import { RecursivePartial, ValidationError } from "../../../../interface";
import { ServiceAPIIntegration } from "../../../integration";
import { Route } from "../../../../server";
import { ProtocolPlugin, ProtocolPluginProps } from "../plugin";
import { GraphQLHandlersOptions } from "./handler";
import { GraphQLProtocolPluginCatalog, GraphQLProtocolPluginSchema } from "./schema";
export declare type GraphQLProtocolPluginOptions = GraphQLHandlersOptions;
export declare class GraphQLProtocolPlugin extends ProtocolPlugin<GraphQLProtocolPluginSchema, GraphQLProtocolPluginCatalog> {
    protected readonly props: ProtocolPluginProps;
    static readonly key = "GraphQL";
    static readonly autoLoadOptions: GraphQLProtocolPluginOptions;
    private readonly opts;
    private static allowedDefKinds;
    private static readonly resolverAllowedDefKinds;
    private static readonly resolverRequiredTypeNames;
    private static readonly isTypeOfFieldName;
    private static readonly forbiddenFieldNames;
    constructor(props: ProtocolPluginProps, opts?: RecursivePartial<GraphQLProtocolPluginOptions>);
    start(): Promise<void>;
    stop(): Promise<void>;
    validateSchema(schema: Readonly<GraphQLProtocolPluginSchema>): ValidationError[];
    compileSchemata(routeHashMapCache: Readonly<Map<string, Readonly<Route>>>, integrations: Array<Readonly<ServiceAPIIntegration>>): Array<{
        hash: string;
        route: Readonly<Route>;
    }>;
    describeSchema(schema: Readonly<GraphQLProtocolPluginSchema>): GraphQLProtocolPluginCatalog;
    private createGraphQLHandlers;
    private createGraphQLResolvers;
    private createGraphQLFieldResolverFromMapConnectorSchema;
    private createGraphQLIsTypeOfFnFromMapConnectorSchema;
    private createGraphQLFieldResolverFromCallConnectorSchema;
    private createGraphQLFieldResolverFromPublishConnectorSchema;
    private createGraphQLFieldResolverFromSubscribeConnectorSchema;
}

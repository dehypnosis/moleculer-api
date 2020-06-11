import { GraphQLOptions } from "apollo-server-core";
import { SubscriptionServerOptions } from "apollo-server-core/src/types";
import { ApolloServer, Config as ApolloServerConfig } from "apollo-server-express";
import { APIRequestContext, HTTPRouteHandler, WebSocketRouteHandler } from "../../../../../server";
export declare type GraphQLHandlersOptions = Omit<ApolloServerConfig, "subscriptions" | "playground" | "schema" | "typeDefs" | "context"> & {
    typeDefs?: string | string[];
    subscriptions?: Omit<SubscriptionServerOptions, "path" | "onConnect" | "onDisconnect"> | false;
    playground?: boolean;
};
export declare class GraphQLHandlers extends ApolloServer {
    constructor(onMessage: (message: string | Error) => void, opts: GraphQLHandlersOptions);
    createGraphQLServerOptionsWithContext(context: APIRequestContext, req: any, res: any): Promise<GraphQLOptions>;
    readonly handler: HTTPRouteHandler;
    readonly subscriptionHandler?: WebSocketRouteHandler;
    readonly playgroundHandler?: HTTPRouteHandler;
    private waitForPromisedVariables;
}

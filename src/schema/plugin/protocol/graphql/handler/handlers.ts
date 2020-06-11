import fs from "fs";
import * as path from "path";
import { convertNodeHttpToRequest, runHttpQuery, processFileUploads, formatApolloErrors, GraphQLOptions } from "apollo-server-core";
import { SubscriptionServerOptions } from "apollo-server-core/src/types";
import { ApolloServer, Config as ApolloServerConfig, makeExecutableSchema } from "apollo-server-express";
import { execute, subscribe } from "graphql";
import { APIRequestContext, HTTPRouteHandler, WebSocketRouteHandler } from "../../../../../server";
import { GraphQLSubscriptionHandler } from "./subscription";

export type GraphQLHandlersOptions = Omit<ApolloServerConfig, "subscriptions" | "playground" | "schema" | "typeDefs" | "context"> & {
  typeDefs?: string | string[];
  subscriptions?: Omit<SubscriptionServerOptions, "path" | "onConnect" | "onDisconnect"> | false;
  playground?: boolean;
};

// ref: https://github.com/apollographql/apollo-server/blob/master/packages/apollo-server-core/src/ApolloServer.ts
export class GraphQLHandlers extends ApolloServer {
  constructor(onMessage: (message: string | Error) => void, opts: GraphQLHandlersOptions) {
    const {typeDefs, resolvers, schemaDirectives, parseOptions, subscriptions, uploads, playground, ...restOptions} = opts;
    const schema = makeExecutableSchema({
      typeDefs: typeDefs || [],
      resolvers,
      logger: {
        log: onMessage,
      },
      allowUndefinedInResolve: false,
      resolverValidationOptions: {
        requireResolversForArgs: true,
        requireResolversForNonScalar: false,
        // requireResolversForAllFields: false,
        requireResolversForResolveType: false, // rather use InterfaceImplementationType.__isTypeOf than InterfaceType.__resolveType for distributed schema
        allowResolversNotInSchema: false,
      },
      schemaDirectives,
      parseOptions,
      inheritResolversFromInterfaces: false,
    });

    super({
      schema,
      ...restOptions,

      // below features are handled separately
      subscriptions: false,
      playground: false,
      uploads: false,

      // context injection
      context: ({ context }: any) => context, // { context, req, res}
    });

    // create graphql request handler
    const optionsFactory = this.createGraphQLServerOptionsWithContext.bind(this);

    const uploadsConfig = typeof uploads !== "object" ? {} : uploads;
    const handler: HTTPRouteHandler = async (context, req, res) => {
      try {
        // process upload
        const contentType = req.header("content-type");
        if (uploads !== false && contentType && contentType.toLowerCase().startsWith("multipart/form-data")) {
          try {
            req.body = await processFileUploads!(req, res, uploadsConfig);
            req.body.variables = await this.waitForPromisedVariables(req.body.variables); // ref: https://github.com/jaydenseric/graphql-upload#upload-instance-property-promise
          } catch (error) {
            if (error.status && error.expose) {
              res.status(error.status);
            }

            throw formatApolloErrors([error], {
              formatter: this.requestOptions.formatError,
              debug: this.requestOptions.debug,
            });
          }
        }

        // run query
        const {graphqlResponse, responseInit} = await runHttpQuery([context, req, res], {
          options: optionsFactory, // invoked with { context, req, res }
          method: req.method,
          query: req.body,
          request: convertNodeHttpToRequest(req),
        });

        if (responseInit.headers) {
          for (const [name, value] of Object.entries(responseInit.headers)) {
            res.setHeader(name, value);
          }
        }

        res.send(graphqlResponse);
      } catch (error) {
        if (error.name !== "HttpQueryError") {
          throw error;
        }

        if (error.headers) {
          for (const [name, value] of Object.entries(error.headers)) {
            res.setHeader(name, value as string);
          }
        }

        res.statusCode = error.statusCode;
        res.send(error.message);
      }
    };
    this.handler = handler.bind(this);

    // create graphql subscription handler
    if (subscriptions !== false) {
      // create subscription handler without subscription server
      this.subscriptionHandler = new GraphQLSubscriptionHandler({
        schema: this.schema,
        execute,
        subscribe,
        ...subscriptions,
      }).handler;
    }

    // create graphql playground handler
    if (playground !== false) {
      const playgroundPath = path.join(__dirname, "../assets/playground.html");
      this.playgroundHandler = (context, req, res) => {
        res.sendFile(playgroundPath);
      };
    }
  }

  public async createGraphQLServerOptionsWithContext(context: APIRequestContext, req: any, res: any): Promise<GraphQLOptions> {
    return super.graphQLServerOptions({context, req, res});
  }

  public readonly handler: HTTPRouteHandler;
  public readonly subscriptionHandler?: WebSocketRouteHandler;
  public readonly playgroundHandler?: HTTPRouteHandler;

  private async waitForPromisedVariables(v: any): Promise<any> {
    if (Array.isArray(v)) {
      return Promise.all(v.map((vv: any) => this.waitForPromisedVariables(vv)));
    } else if (typeof v === "object" && v !== null) {
      if (typeof v.then === "function") {
        return await v;
      }
      return Promise.all(Object.entries(v).map(async ([kk, vv]: any) => [kk, await this.waitForPromisedVariables(vv)]))
        .then((entries) => entries.reduce((obj, [kk, vv]) => {
          obj[kk] = vv;
          return obj;
        }, {} as any));
    }
    return v;
  }
}

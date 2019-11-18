"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const path = tslib_1.__importStar(require("path"));
const apollo_server_core_1 = require("apollo-server-core");
const apollo_server_express_1 = require("apollo-server-express");
const graphql_1 = require("graphql");
const subscription_1 = require("./subscription");
// ref: https://github.com/apollographql/apollo-server/blob/master/packages/apollo-server-core/src/ApolloServer.ts
class GraphQLHandlers extends apollo_server_express_1.ApolloServer {
    constructor(onMessage, opts) {
        const { typeDefs, resolvers, schemaDirectives, parseOptions, subscriptions, uploads, playground } = opts, restOptions = tslib_1.__rest(opts, ["typeDefs", "resolvers", "schemaDirectives", "parseOptions", "subscriptions", "uploads", "playground"]);
        const schema = apollo_server_express_1.makeExecutableSchema({
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
                requireResolversForResolveType: false,
                allowResolversNotInSchema: false,
            },
            schemaDirectives,
            parseOptions,
            inheritResolversFromInterfaces: false,
        });
        super(Object.assign(Object.assign({ schema }, restOptions), { 
            // below features are handled separately
            subscriptions: false, playground: false, uploads: false, 
            // context injection
            context: ({ context }) => context }));
        // create graphql request handler
        const uploadsConfig = typeof uploads !== "object" ? {} : uploads;
        const optionsFactory = this.createGraphQLServerOptionsWithContext.bind(this);
        const handler = (context, req, res) => tslib_1.__awaiter(this, void 0, void 0, function* () {
            try {
                // process upload
                const contentType = req.header("content-type");
                if (uploads !== false && contentType && contentType.toLowerCase().startsWith("multipart/form-data")) {
                    try {
                        req.body = yield apollo_server_core_1.processFileUploads(req, res, uploadsConfig);
                    }
                    catch (error) {
                        if (error.status && error.expose) {
                            res.status(error.status);
                        }
                        throw apollo_server_core_1.formatApolloErrors([error], {
                            formatter: this.requestOptions.formatError,
                            debug: this.requestOptions.debug,
                        });
                    }
                }
                // run query
                const { graphqlResponse, responseInit } = yield apollo_server_core_1.runHttpQuery([context, req, res], {
                    options: optionsFactory,
                    method: req.method,
                    query: req.body,
                    request: apollo_server_core_1.convertNodeHttpToRequest(req),
                });
                if (responseInit.headers) {
                    for (const [name, value] of Object.entries(responseInit.headers)) {
                        res.setHeader(name, value);
                    }
                }
                res.send(graphqlResponse);
            }
            catch (error) {
                if (error.name !== "HttpQueryError") {
                    throw error;
                }
                if (error.headers) {
                    for (const [name, value] of Object.entries(error.headers)) {
                        res.setHeader(name, value);
                    }
                }
                res.statusCode = error.statusCode;
                res.send(error.message);
            }
        });
        this.handler = handler.bind(this);
        // create graphql subscription handler
        if (subscriptions !== false) {
            // create subscription handler without subscription server
            this.subscriptionHandler = new subscription_1.GraphQLSubscriptionHandler(Object.assign({ schema: this.schema, execute: graphql_1.execute,
                subscribe: graphql_1.subscribe }, subscriptions)).handler;
        }
        // create graphql playground handler
        if (playground !== false) {
            const playgroundPath = path.join(__dirname, "../assets/playground.html");
            this.playgroundHandler = (context, req, res) => {
                res.sendFile(playgroundPath);
            };
        }
    }
    createGraphQLServerOptionsWithContext(context, req, res) {
        const _super = Object.create(null, {
            graphQLServerOptions: { get: () => super.graphQLServerOptions }
        });
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            return _super.graphQLServerOptions.call(this, { context, req, res });
        });
    }
}
exports.GraphQLHandlers = GraphQLHandlers;
//# sourceMappingURL=handlers.js.map
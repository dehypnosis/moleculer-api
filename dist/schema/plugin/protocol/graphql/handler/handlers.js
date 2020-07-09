"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GraphQLHandlers = void 0;
const tslib_1 = require("tslib");
const path = tslib_1.__importStar(require("path"));
const apollo_server_core_1 = require("apollo-server-core");
const apollo_server_express_1 = require("apollo-server-express");
const graphql_1 = require("graphql");
const subscription_1 = require("./subscription");
const dummyResolvers = {
    Query: {
        placeholder: () => {
            return "DUMMY-Query";
        },
    },
    Mutation: {
        placeholder: () => {
            return "DUMMY-Mutation";
        },
    },
    Subscription: {
        placeholder: {
            subscribe: () => (function dummyGenerator() {
                return tslib_1.__asyncGenerator(this, arguments, function* dummyGenerator_1() {
                    let i = 0;
                    while (i < 10) {
                        yield tslib_1.__await(new Promise(resolve => setTimeout(resolve, 1000)));
                        yield yield tslib_1.__await(`DUMMY-Subscription (${i++})`);
                    }
                });
            })(),
            resolve: (source) => source,
        },
    },
};
// ref: https://github.com/apollographql/apollo-server/blob/master/packages/apollo-server-core/src/ApolloServer.ts
class GraphQLHandlers extends apollo_server_express_1.ApolloServer {
    constructor(onMessage, opts) {
        const { typeDefs = [], resolvers = [], schemaDirectives, parseOptions, subscriptions, uploads, playground } = opts, restOptions = tslib_1.__rest(opts, ["typeDefs", "resolvers", "schemaDirectives", "parseOptions", "subscriptions", "uploads", "playground"]);
        const parsedTypeDefs = (Array.isArray(typeDefs) ? typeDefs : [typeDefs]).map(defs => typeof defs === "string" ? graphql_1.parse(defs, opts.parseOptions) : defs);
        // check root type definitions
        const hasRootTypeDef = { Query: false, Mutation: false, Subscription: false };
        const hasRootTypeFields = { Query: false, Mutation: false, Subscription: false };
        for (const defs of parsedTypeDefs) {
            for (const def of defs.definitions) {
                if (def.kind === "ObjectTypeDefinition") {
                    const typeName = def.name.value;
                    if (typeof hasRootTypeDef[typeName] !== "undefined") {
                        hasRootTypeDef[typeName] = true;
                        if (!hasRootTypeFields[typeName] && def.fields && def.fields.length > 0) {
                            hasRootTypeFields[typeName] = true;
                        }
                    }
                }
                else if (def.kind === "ObjectTypeExtension") {
                    const typeName = def.name.value;
                    if (!hasRootTypeFields[typeName] && def.fields && def.fields.length > 0) {
                        hasRootTypeFields[typeName] = true;
                    }
                }
            }
        }
        // add placeholders for root types
        const rootTypeDefs = [];
        const rootResolvers = {};
        for (const typeName of Object.keys(hasRootTypeDef)) {
            if (!hasRootTypeDef[typeName] && !hasRootTypeFields[typeName]) {
                rootTypeDefs.push(`
        type ${typeName} {
          placeholder: String!
        }
      `);
                rootResolvers[typeName] = {
                    placeholder: dummyResolvers[typeName].placeholder,
                };
            }
            else if (!hasRootTypeFields[typeName]) {
                rootTypeDefs.push(`
        extend type ${typeName} {
          placeholder: String!
        }
      `);
                rootResolvers[typeName] = {
                    placeholder: dummyResolvers[typeName].placeholder,
                };
            }
            else if (!hasRootTypeDef[typeName]) {
                rootTypeDefs.push(`type ${typeName}\n`);
            }
        }
        const schema = apollo_server_express_1.makeExecutableSchema({
            typeDefs: parsedTypeDefs.concat(rootTypeDefs),
            resolvers: (Array.isArray(resolvers) ? resolvers : [resolvers]).concat(rootResolvers),
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
        const optionsFactory = this.createGraphQLServerOptionsWithContext.bind(this);
        const uploadsConfig = typeof uploads !== "object" ? {} : uploads;
        const handler = (context, req, res) => tslib_1.__awaiter(this, void 0, void 0, function* () {
            try {
                // process upload
                const contentType = req.header("content-type");
                if (uploads !== false && contentType && contentType.toLowerCase().startsWith("multipart/form-data")) {
                    try {
                        req.body = yield apollo_server_core_1.processFileUploads(req, res, uploadsConfig);
                        req.body.variables = yield this.waitForPromisedVariables(req.body.variables); // ref: https://github.com/jaydenseric/graphql-upload#upload-instance-property-promise
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
    waitForPromisedVariables(v) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            if (Array.isArray(v)) {
                return Promise.all(v.map((vv) => this.waitForPromisedVariables(vv)));
            }
            else if (typeof v === "object" && v !== null) {
                if (typeof v.then === "function") {
                    return yield v;
                }
                return Promise.all(Object.entries(v).map(([kk, vv]) => tslib_1.__awaiter(this, void 0, void 0, function* () { return [kk, yield this.waitForPromisedVariables(vv)]; })))
                    .then((entries) => entries.reduce((obj, [kk, vv]) => {
                    obj[kk] = vv;
                    return obj;
                }, {}));
            }
            return v;
        });
    }
}
exports.GraphQLHandlers = GraphQLHandlers;
//# sourceMappingURL=handlers.js.map
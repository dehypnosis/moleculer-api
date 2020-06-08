"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GraphQLProtocolPlugin = void 0;
const tslib_1 = require("tslib");
const _ = tslib_1.__importStar(require("lodash"));
const interface_1 = require("../../../../interface");
const server_1 = require("../../../../server");
const connector_1 = require("../../connector");
const plugin_1 = require("../plugin");
const language_1 = require("graphql/language");
const handler_1 = require("./handler");
let GraphQLProtocolPlugin = /** @class */ (() => {
    class GraphQLProtocolPlugin extends plugin_1.ProtocolPlugin {
        constructor(props, opts) {
            super(props);
            this.props = props;
            this.opts = _.defaultsDeep(opts || {}, GraphQLProtocolPlugin.autoLoadOptions);
        }
        start() {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
            });
        }
        stop() {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
            });
        }
        validateSchema(schema) {
            const typeDefs = [];
            return interface_1.validateObject(schema, {
                description: {
                    type: "string",
                    optional: true,
                },
                typeDefs: {
                    type: "custom",
                    check(value) {
                        // parse graphql.documentNode which can be generated with gql` ... `
                        if (typeof value === "object" && value !== null) {
                            try {
                                value = language_1.print(value);
                            }
                            catch (error) {
                                return [{
                                        field: `typeDefs`,
                                        type: "typeDefsSyntax",
                                        message: error.message,
                                        actual: value,
                                    }];
                            }
                        }
                        // parse string
                        if (typeof value !== "string") {
                            return [{
                                    field: `typeDefs`,
                                    type: "typeDefsSyntax",
                                    message: "type definitions must be string or valid graphql.DocumentNode",
                                    actual: value,
                                }];
                        }
                        const errors = [];
                        try {
                            // parse GraphQL Schema
                            const doc = language_1.parse(value, { noLocation: false });
                            for (const def of doc.definitions) {
                                if (!GraphQLProtocolPlugin.allowedDefKinds.includes(def.kind)) {
                                    errors.push({
                                        field: `typeDefs`,
                                        type: "typeDefsForbidden",
                                        // @ts-ignore
                                        message: `${def.name ? `${def.name.value} (${def.kind})` : def.kind} is not allowed`,
                                        actual: language_1.print(def),
                                    });
                                }
                                else {
                                    typeDefs.push(def);
                                }
                            }
                        }
                        catch (error) {
                            // parsing error
                            const location = error.locations && error.locations[0] || null;
                            errors.push({
                                field: `typeDefs`,
                                type: "typeDefsSyntax",
                                message: error.message.replace("Syntax Error: ", ""),
                                actual: value,
                                location,
                            });
                        }
                        return errors.length === 0 ? true : errors;
                    },
                },
                resolvers: {
                    type: "custom",
                    check(value) {
                        if (typeof value !== "object" || value === null) {
                            return [{
                                    field: `resolvers`,
                                    type: "resolversInvalid",
                                    message: "type resolvers should be an object",
                                    actual: value,
                                }];
                        }
                        const errors = [];
                        for (let typeDef of typeDefs) {
                            const typeName = typeDef.name.value;
                            const typeResolver = value[typeName];
                            // not a type which can have resolver
                            if (!GraphQLProtocolPlugin.resolverAllowedDefKinds.includes(typeDef.kind)) {
                                // this type should not have resolver
                                if (typeof typeResolver !== "undefined") {
                                    errors.push({
                                        field: `resolvers.${typeName}`,
                                        type: "typeResolverInvalid",
                                        message: `${typeName} cannot have a type resolver`,
                                        actual: typeResolver,
                                        expected: undefined,
                                    });
                                }
                                continue;
                            }
                            typeDef = typeDef;
                            const typeFieldNames = typeDef.fields ? typeDef.fields.map(f => f.name.value) : [];
                            const typeForbiddenFieldNames = typeFieldNames.filter(f => GraphQLProtocolPlugin.forbiddenFieldNames.includes(f));
                            // type has forbidden fields
                            if (typeForbiddenFieldNames.length > 0) {
                                errors.push({
                                    field: `typeDefs`,
                                    type: "typeDefsForbidden",
                                    message: `${typeName} cannot define preserved fields`,
                                    actual: typeForbiddenFieldNames,
                                    expected: undefined,
                                });
                                continue;
                            }
                            // __isTypeOf field resolver is required for interface implementation
                            const isTypeOfFieldResolverRequired = typeDef.interfaces && typeDef.interfaces.length > 0;
                            if (isTypeOfFieldResolverRequired) {
                                typeFieldNames.push(GraphQLProtocolPlugin.isTypeOfFieldName);
                            }
                            // type has no resolver
                            if (typeof typeResolver !== "object" || typeResolver === null) {
                                // this type should have resolver
                                if (GraphQLProtocolPlugin.resolverRequiredTypeNames.includes(typeName) || isTypeOfFieldResolverRequired) {
                                    errors.push({
                                        field: `resolvers.${typeName}`,
                                        type: "typeResolverRequired",
                                        message: `${typeName} should have a type resolver`,
                                        actual: typeResolver,
                                        expected: `${typeFieldNames.length > 0 ? `{ [fieldName in "${typeFieldNames.join(`" | "`)}"]: GraphQLFieldResolverSchema }` : "{}"} }`,
                                    });
                                }
                                continue;
                            }
                            // all fields of resolvers should have been defined on typeDef
                            const typeResolverKeys = Object.keys(typeResolver);
                            for (const resolverFieldName of typeResolverKeys) {
                                if (!typeFieldNames.includes(resolverFieldName)) {
                                    errors.push({
                                        field: `resolvers.${typeName}.${resolverFieldName}`,
                                        type: "fieldResolverUnnecessary",
                                        message: `${typeName} have an unnecessary field resolver for ${resolverFieldName}`,
                                        actual: typeResolver[resolverFieldName],
                                        expected: undefined,
                                    });
                                }
                            }
                            // check field resolvers
                            for (const fieldName of typeFieldNames) {
                                const fieldResolver = typeResolver[fieldName];
                                // check __isTypeOf field resolver
                                if (fieldName === GraphQLProtocolPlugin.isTypeOfFieldName) {
                                    if (typeof fieldResolver !== "string") {
                                        errors.push({
                                            field: `resolvers.${typeName}.${fieldName}`,
                                            type: typeof fieldResolver === "undefined" ? "fieldResolverRequired" : "fieldResolverInvalid",
                                            message: `${typeName} should have an ${fieldName} field resolver which is a string denotes a JavaScript function to distinguish the type among types which implement interfaces: ${typeDef.interfaces.map(i => i.name.value).join(", ")}`,
                                            actual: fieldResolver,
                                            expected: `GraphQLIsTypeOfFieldResolverSchema`,
                                        });
                                    }
                                    continue;
                                }
                                // check regular field resolver
                                let rule;
                                switch (typeName) {
                                    case "Mutation":
                                        if (typeof fieldResolver === "object" && fieldResolver !== null && typeof fieldResolver.call !== "undefined") {
                                            rule = {
                                                type: "object",
                                                strict: true,
                                                props: {
                                                    call: connector_1.ConnectorValidator.call,
                                                },
                                                messages: {
                                                    objectStrict: "GraphQLCallableFieldResolverSchema cannot be with other connectors",
                                                },
                                            };
                                        }
                                        else if (typeof fieldResolver === "object" && fieldResolver !== null && typeof fieldResolver.publish !== "undefined") {
                                            rule = {
                                                type: "object",
                                                strict: true,
                                                props: {
                                                    publish: connector_1.ConnectorValidator.publish,
                                                },
                                                messages: {
                                                    objectStrict: "GraphQLPublishableFieldResolverSchema cannot be with other connectors",
                                                },
                                            };
                                        }
                                        else {
                                            errors.push({
                                                field: `resolvers.${typeName}.${fieldName}`,
                                                type: typeof fieldResolver === "undefined" ? "fieldResolverRequired" : "fieldResolverInvalid",
                                                message: `${typeName} should have an ${fieldName} field resolver which is an object having either call or publish property`,
                                                expected: `Omit<GraphQLCallableFieldResolverSchema, "ignoreError"> | GraphQLPublishableFieldResolverSchema`,
                                            });
                                        }
                                        break;
                                    case "Subscription":
                                        if (typeof fieldResolver === "object" && fieldResolver !== null && typeof fieldResolver.subscribe !== "undefined") {
                                            rule = {
                                                type: "object",
                                                strict: true,
                                                props: {
                                                    subscribe: connector_1.ConnectorValidator.subscribe,
                                                },
                                                messages: {
                                                    objectStrict: "GraphQLCallableFieldResolverSchema cannot be with other connectors",
                                                },
                                            };
                                        }
                                        else {
                                            errors.push({
                                                field: `resolvers.${typeName}.${fieldName}`,
                                                type: typeof fieldResolver === "undefined" ? "fieldResolverRequired" : "fieldResolverInvalid",
                                                message: `${typeName} should have an ${fieldName} field resolver which is an object having subscribe property`,
                                                expected: `GraphQLSubscribableFieldResolverSchema`,
                                            });
                                        }
                                        break;
                                    case "Query":
                                    default:
                                        if (typeof fieldResolver === "object" && fieldResolver !== null && typeof fieldResolver.call !== "undefined") {
                                            rule = {
                                                type: "object",
                                                strict: true,
                                                props: {
                                                    call: connector_1.ConnectorValidator.call,
                                                    ignoreError: {
                                                        type: "boolean",
                                                        optional: true,
                                                    },
                                                },
                                                messages: {
                                                    objectStrict: "GraphQLCallableFieldResolverSchema cannot be with other connectors",
                                                },
                                            };
                                        }
                                        else if (typeof fieldResolver === "string") {
                                            rule = connector_1.ConnectorValidator.map;
                                        }
                                        else {
                                            // regular types can omit field resolvers (use default field resolver)
                                            if (typeof fieldResolver === "undefined" && typeName !== "Query") {
                                                break;
                                            }
                                            errors.push({
                                                field: `resolvers.${typeName}.${fieldName}`,
                                                type: typeof fieldResolver === "undefined" ? "fieldResolverRequired" : "fieldResolverInvalid",
                                                message: `${typeName} should have an ${fieldName} field resolver which is either an object having call property or a string which denotes a JavaScript function`,
                                                expected: `GraphQLCallableFieldResolverSchema | GraphQLMappableFieldResolverSchema`,
                                            });
                                        }
                                        break;
                                }
                                // @ts-ignore
                                if (rule) {
                                    errors.push(...interface_1.validateValue(fieldResolver, 
                                    // @ts-ignore
                                    rule, {
                                        strict: true,
                                        field: `resolvers.${typeName}.${fieldName}`,
                                    }));
                                }
                            } // end-of: typeFieldNames for-loop
                        } // end-of: typeDefs for-loop
                        return errors.length === 0 ? true : errors;
                    },
                },
            }, {
                strict: true,
            });
        }
        compileSchemata(routeHashMapCache, integrations) {
            const items = new Array();
            /* calculate integrated hash to fetch cached handlers */
            const hashes = [];
            for (const integration of integrations) {
                const schema = integration.schema.protocol[this.key];
                // the source object below hash contains properties which can make this route unique
                hashes.push(interface_1.hashObject([schema.typeDefs, schema.resolvers, integration.service.hash], true));
            }
            const routeHash = interface_1.hashObject(hashes, false);
            const subscriptionRouteHash = `${routeHash}@subscription`;
            const playgroundRouteHash = `static@graphql-playground`;
            // cache hit
            const cachedRoute = routeHashMapCache.get(routeHash);
            const cachedSubscriptionRoute = routeHashMapCache.get(subscriptionRouteHash);
            const cachedPlaygroundRoute = routeHashMapCache.get(playgroundRouteHash);
            if (cachedRoute) {
                items.push({ hash: routeHash, route: cachedRoute });
                // both playground and subscription handlers are optional
                if (cachedSubscriptionRoute) {
                    items.push({ hash: subscriptionRouteHash, route: cachedSubscriptionRoute });
                }
                if (cachedPlaygroundRoute) {
                    items.push({ hash: playgroundRouteHash, route: cachedPlaygroundRoute });
                }
                return items;
            }
            // create new GraphQL routes
            const { route, subscriptionRoute, playgroundRoute } = this.createGraphQLHandlers(integrations);
            items.push({ hash: routeHash, route });
            // both playground and subscription handlers are optional
            if (subscriptionRoute) {
                items.push({ hash: subscriptionRouteHash, route: subscriptionRoute });
            }
            if (playgroundRoute) {
                items.push({ hash: playgroundRouteHash, route: playgroundRoute });
            }
            return items;
        }
        // TODO: GraphQL Plugin catalog
        describeSchema(schema) {
            return {};
        }
        // @throwable
        createGraphQLHandlers(integrations) {
            const typeDefs = [];
            let resolvers = {};
            for (const integration of integrations) {
                const schema = integration.schema.protocol[this.key];
                typeDefs.push(typeof schema.typeDefs === "string" ? schema.typeDefs : language_1.print(schema.typeDefs));
                resolvers = _.merge(resolvers, this.createGraphQLResolvers(schema.resolvers, integration));
            }
            const { handler, subscriptionHandler, playgroundHandler } = new handler_1.GraphQLHandlers((message) => {
                this.props.logger.error(message);
            }, Object.assign(Object.assign({}, this.opts), { typeDefs: typeDefs.concat(this.opts.typeDefs || []), resolvers: [resolvers].concat(this.opts.resolvers || []) }));
            return {
                route: new server_1.HTTPRoute({
                    method: "POST",
                    path: "/graphql",
                    description: "GraphQL HTTP operation endpoint",
                    handler,
                }),
                subscriptionRoute: subscriptionHandler ? new server_1.WebSocketRoute({
                    path: "/graphql",
                    description: "GraphQL WebSocket operation endpoint",
                    handler: subscriptionHandler,
                }) : undefined,
                playgroundRoute: playgroundHandler ? new server_1.HTTPRoute({
                    method: "GET",
                    path: "/graphql",
                    description: "GraphQL Playground endpoint",
                    handler: playgroundHandler,
                }) : undefined,
            };
        }
        createGraphQLResolvers(resolversSchema, integration) {
            const resolvers = {};
            const { Query, Mutation, Subscription } = resolversSchema, ObjectTypes = tslib_1.__rest(resolversSchema, ["Query", "Mutation", "Subscription"]);
            // create query resolver
            if (Query) {
                const typeResolver = resolvers.Query = {};
                for (const [fieldName, fieldSchema] of Object.entries(Query)) {
                    if (typeof fieldSchema === "string") {
                        typeResolver[fieldName] = this.createGraphQLFieldResolverFromMapConnectorSchema(fieldSchema, integration);
                    }
                    else if (fieldSchema && fieldSchema.call) {
                        typeResolver[fieldName] = this.createGraphQLFieldResolverFromCallConnectorSchema(fieldSchema, integration);
                    }
                }
            }
            // create mutation resolver
            if (Mutation) {
                const typeResolver = resolvers.Mutation = {};
                for (const [fieldName, fieldSchema] of Object.entries(Mutation)) {
                    if (fieldSchema && fieldSchema.call) {
                        typeResolver[fieldName] = this.createGraphQLFieldResolverFromCallConnectorSchema(fieldSchema, integration);
                    }
                    else if (fieldSchema && fieldSchema.publish) {
                        typeResolver[fieldName] = this.createGraphQLFieldResolverFromPublishConnectorSchema(fieldSchema, integration);
                    }
                }
            }
            // create subscription resolver
            if (Subscription) {
                const typeResolver = resolvers.Subscription = {};
                for (const [fieldName, fieldSchema] of Object.entries(Subscription)) {
                    if (fieldSchema && fieldSchema.subscribe) {
                        typeResolver[fieldName] = this.createGraphQLFieldResolverFromSubscribeConnectorSchema(fieldSchema, integration);
                    }
                }
            }
            // create other object resolvers
            for (const [typeName, ObjectType] of Object.entries(ObjectTypes)) {
                const typeResolver = resolvers[typeName] = {};
                for (const [fieldName, fieldSchema] of Object.entries(ObjectType)) {
                    if (typeof fieldSchema === "string") {
                        if (fieldName === GraphQLProtocolPlugin.isTypeOfFieldName) {
                            typeResolver[fieldName] = this.createGraphQLIsTypeOfFnFromMapConnectorSchema(fieldSchema, integration);
                        }
                        else {
                            typeResolver[fieldName] = this.createGraphQLFieldResolverFromMapConnectorSchema(fieldSchema, integration);
                        }
                    }
                    else if (fieldSchema && fieldSchema.call) {
                        typeResolver[fieldName] = this.createGraphQLFieldResolverFromCallConnectorSchema(fieldSchema, integration);
                    }
                }
            }
            return resolvers;
        }
        createGraphQLFieldResolverFromMapConnectorSchema(schema, integration) {
            const mapConnector = connector_1.ConnectorCompiler.map(schema, integration, {
                mappableKeys: ["context", "source", "args", "info"],
            });
            return (source, args, context, info) => mapConnector({ context, source, args, info });
        }
        createGraphQLIsTypeOfFnFromMapConnectorSchema(schema, integration) {
            const mapConnector = connector_1.ConnectorCompiler.map(schema, integration, {
                mappableKeys: ["context", "source", "info"],
            });
            return (source, context, info) => mapConnector({ context, source, info });
        }
        createGraphQLFieldResolverFromCallConnectorSchema(schema, integration) {
            const callConnector = connector_1.ConnectorCompiler.call(schema.call, integration, this.props.policyPlugins, {
                explicitMappableKeys: ["context", "source", "args", "info"],
                implicitMappableKeys: ["source", "args"],
                batchingEnabled: true,
                disableCache: false,
            });
            const { ignoreError } = schema;
            return (source, args, context, info) => {
                const mappableArgs = { source, args, context, info };
                return callConnector(context, mappableArgs)
                    .catch(error => {
                    if (ignoreError) {
                        return null;
                    }
                    else {
                        throw error;
                    }
                });
            };
        }
        createGraphQLFieldResolverFromPublishConnectorSchema(schema, integration) {
            const publishConnector = connector_1.ConnectorCompiler.publish(schema.publish, integration, this.props.policyPlugins, {
                mappableKeys: ["context", "source", "args", "info"],
            });
            return (source, args, context, info) => publishConnector(context, { context, source, args, info });
        }
        createGraphQLFieldResolverFromSubscribeConnectorSchema(schema, integration) {
            const subscribeConnector = connector_1.ConnectorCompiler.subscribe(schema.subscribe, integration, this.props.policyPlugins, {
                mappableKeys: ["context", "source", "args", "info"],
                getAsyncIterator: true,
            });
            return {
                subscribe: (source, args, context, info) => subscribeConnector(context, { context, source, args, info }, null),
            };
        }
    }
    GraphQLProtocolPlugin.key = "GraphQL";
    GraphQLProtocolPlugin.autoLoadOptions = handler_1.defaultGraphQLHandlersOptions;
    GraphQLProtocolPlugin.allowedDefKinds = [
        "ObjectTypeDefinition", "ObjectTypeExtension",
        "InterfaceTypeDefinition", "InterfaceTypeExtension",
        "UnionTypeDefinition", "UnionTypeExtension",
        "EnumTypeDefinition", "EnumTypeExtension",
        "InputObjectTypeDefinition",
    ];
    GraphQLProtocolPlugin.resolverAllowedDefKinds = ["ObjectTypeDefinition", "ObjectTypeExtension"];
    GraphQLProtocolPlugin.resolverRequiredTypeNames = ["Query", "Mutation", "Subscription"];
    GraphQLProtocolPlugin.isTypeOfFieldName = "__isTypeOf";
    GraphQLProtocolPlugin.forbiddenFieldNames = ["__isTypeOf", "__resolveType", "isTypeOf", "resolveType"];
    return GraphQLProtocolPlugin;
})();
exports.GraphQLProtocolPlugin = GraphQLProtocolPlugin;
//# sourceMappingURL=plugin.js.map
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RESTProtocolPlugin = void 0;
const tslib_1 = require("tslib");
const _ = tslib_1.__importStar(require("lodash"));
const interface_1 = require("../../../../interface");
const server_1 = require("../../../../server");
const plugin_1 = require("../plugin");
const handler_1 = require("./handler");
const connector_1 = require("../../connector");
class RESTProtocolPlugin extends plugin_1.ProtocolPlugin {
    constructor(props, opts) {
        super(props);
        this.props = props;
        this.opts = _.defaultsDeep(opts || {}, RESTProtocolPlugin.autoLoadOptions);
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
        const routeMethodAndPaths = [];
        return interface_1.validateObject(schema, {
            description: {
                type: "string",
                optional: true,
            },
            basePath: {
                type: "custom",
                check(value) {
                    if (server_1.HTTPRoute.isNonRootStaticPath(value)) {
                        return true;
                    }
                    return [{
                            type: "basePathInvalid",
                            field: "basePath",
                            actual: value,
                            expected: server_1.HTTPRoute.nonRootStaticPathRegExp,
                            message: `basePath should be a valid non-root static path: eg. "/players" | "/players/billings"`,
                        }];
                },
            },
            routes: {
                type: "array",
                empty: false,
                items: {
                    type: "custom",
                    check(value) {
                        const idx = schema.routes.indexOf(value);
                        if (typeof value !== "object") {
                            return [{
                                    field: `routes[${idx}]`,
                                    type: "type",
                                    message: "route definition should be an object",
                                    actual: value,
                                }];
                        }
                        const { path, deprecated, description, method } = value, restProps = tslib_1.__rest(value, ["path", "deprecated", "description", "method"]);
                        // path: string;
                        if (!server_1.HTTPRoute.isNonRootDynamicPath(path) && !server_1.HTTPRoute.isRootStaticPath(path)) {
                            return [{
                                    field: `routes[${idx}].path`,
                                    type: "routePathInvalid",
                                    actual: path,
                                    expected: [server_1.HTTPRoute.nonRootDynamicPath, server_1.HTTPRoute.rootStaticPathRegExp],
                                    message: `route path should be a valid path: eg. "/" | "/accounts" | "/accounts/:id"`,
                                }];
                        }
                        // description?: string;
                        // deprecated?: boolean;
                        // method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE"
                        const errors = interface_1.validateObject({ deprecated, description, method }, {
                            description: {
                                type: "string",
                                optional: true,
                            },
                            deprecated: {
                                type: "boolean",
                                optional: true,
                            },
                            method: {
                                type: "enum",
                                values: ["GET", "POST", "PUT", "PATCH", "DELETE"],
                            },
                        }, {
                            strict: true,
                            field: `routes[${idx}]`,
                        });
                        if (errors.length === 0) {
                            // check duplicate path
                            const routePathAndMethod = `${method} ${path}`;
                            if (routeMethodAndPaths.includes(routePathAndMethod)) {
                                return [{
                                        field: `routes[${idx}].path`,
                                        type: "routePathDuplicate",
                                        actual: routePathAndMethod,
                                        expected: undefined,
                                        message: `a pair of route method and path should be unique"`,
                                    }];
                            }
                            routeMethodAndPaths.push(routePathAndMethod);
                        }
                        // validate method and each connector
                        let rule;
                        switch (method) {
                            case "GET":
                                if (typeof restProps.call !== "undefined") {
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
                                            objectStrict: "RESTCallableRouteResolverSchema cannot be with other connectors",
                                        },
                                    };
                                }
                                else if (typeof restProps.map !== "undefined") {
                                    rule = {
                                        type: "object",
                                        strict: true,
                                        props: {
                                            map: connector_1.ConnectorValidator.map,
                                        },
                                        messages: {
                                            objectStrict: "RESTMappableRouteResolverSchema cannot be with other connectors",
                                        },
                                    };
                                }
                                else {
                                    errors.push({
                                        type: "routeInvalid",
                                        field: `routes[${idx}]`,
                                        message: `${method} route should have either call or map property`,
                                        expected: "RESTCallableRouteResolverSchema | RESTMappableRouteResolverSchema",
                                    });
                                }
                                break;
                            case "POST":
                            case "PUT":
                            case "PATCH":
                            case "DELETE":
                                if (typeof restProps.call !== "undefined") {
                                    rule = {
                                        type: "object",
                                        strict: true,
                                        props: {
                                            call: connector_1.ConnectorValidator.call,
                                        },
                                        messages: {
                                            objectStrict: "RESTCallableRouteResolverSchema cannot be with other connectors",
                                        },
                                    };
                                }
                                else if (restProps.publish !== "undefined") {
                                    rule = {
                                        type: "object",
                                        strict: true,
                                        props: {
                                            publish: connector_1.ConnectorValidator.publish,
                                        },
                                        messages: {
                                            objectStrict: "RESTPublishableRouteResolverSchema cannot be with other connectors",
                                        },
                                    };
                                }
                                else {
                                    errors.push({
                                        type: "routeInvalid",
                                        field: `routes[${idx}]`,
                                        message: `${method} route should have either call or publish property`,
                                        expected: `Omit<RESTCallableRouteResolverSchema, "ignoreError"> | RESTPublishableRouteResolverSchema`,
                                    });
                                }
                                break;
                        }
                        // @ts-ignore
                        if (rule) {
                            errors.push(...interface_1.validateValue(restProps, 
                            // @ts-ignore
                            rule, {
                                strict: true,
                                field: `routes[${idx}]`,
                            }));
                        }
                        return errors;
                    },
                },
            },
        }, {
            strict: true,
        });
    }
    compileSchemata(routeHashMapCache, integrations, branch) {
        const items = new Array();
        // introspection routes
        if (this.opts.introspection) {
            const introspectionRouteHash = "static@introspection";
            items.push({
                hash: introspectionRouteHash,
                route: routeHashMapCache.get(introspectionRouteHash) || new server_1.HTTPRoute({
                    path: "/~status",
                    method: "GET",
                    description: `${branch.name} branch introspection endpoint`,
                    handler: (context, req, res) => tslib_1.__awaiter(this, void 0, void 0, function* () {
                        this.sendResponse(res, branch.getInformation(true));
                    }),
                }),
            });
        }
        for (const integration of integrations) {
            const schema = integration.schema.protocol[this.key];
            for (const routeSchema of schema.routes) {
                // the source object below hash contains properties which can make this route unique
                const routeHash = interface_1.hashObject([schema.basePath, routeSchema, integration.service.hash], true);
                // cache hit
                const cachedRoute = routeHashMapCache.get(routeHash);
                if (cachedRoute) {
                    items.push({ hash: routeHash, route: cachedRoute });
                    continue;
                }
                const path = server_1.HTTPRoute.mergePaths(schema.basePath, routeSchema.path);
                const method = routeSchema.method;
                let route;
                switch (method) {
                    case "GET":
                        if (routeSchema.call) {
                            route = this.createRouteFromCallConnectorScheme(path, method, routeSchema, integration);
                        }
                        else if (routeSchema.map) {
                            route = this.createRouteFromMapConnectorScheme(path, method, routeSchema, integration);
                        }
                        break;
                    default:
                        if (routeSchema.call) {
                            route = this.createRouteFromCallConnectorScheme(path, method, routeSchema, integration);
                        }
                        else if (routeSchema.publish) {
                            route = this.createRouteFromPublishConnectorScheme(path, method, routeSchema, integration);
                        }
                }
                if (route) {
                    items.push({ hash: routeHash, route });
                }
            }
        }
        return items;
    }
    createRouteFromMapConnectorScheme(path, method, schema, integration) {
        const mapConnector = connector_1.ConnectorCompiler.map(schema.map, integration, {
            mappableKeys: ["context", "path", "query", "body"],
        });
        const handler = (context, req, res) => {
            const { params, query, body } = req;
            const mappableArgs = { context, path: params, query, body };
            const result = mapConnector(mappableArgs);
            this.sendResponse(res, result);
        };
        return new server_1.HTTPRoute({
            path,
            method,
            description: schema.description || null,
            handler,
        });
    }
    createRouteFromCallConnectorScheme(path, method, schema, integration) {
        const callConnector = connector_1.ConnectorCompiler.call(schema.call, integration, this.props.policyPlugins, {
            explicitMappableKeys: ["context", "path", "query", "body"],
            implicitMappableKeys: ["path"],
            batchingEnabled: false,
            disableCache: false,
        });
        const { ignoreError } = schema;
        const multipart = new handler_1.MultipartFormDataHandler(this.opts.uploads);
        const handler = (context, req, res) => tslib_1.__awaiter(this, void 0, void 0, function* () {
            try {
                // process multipart/form-data
                const uploads = yield multipart.collect(req, res);
                if (uploads) {
                    req.body = Object.assign(req.body || {}, uploads);
                }
                const { params, query, body } = req;
                const mappableArgs = { context, path: params, query, body };
                const result = yield callConnector(context, mappableArgs);
                this.sendResponse(res, result);
            }
            catch (error) {
                if (ignoreError) {
                    this.sendResponse(res, null);
                }
                else {
                    throw error;
                }
            }
        });
        return new server_1.HTTPRoute({
            path,
            method,
            description: schema.description || null,
            handler,
        });
    }
    createRouteFromPublishConnectorScheme(path, method, schema, integration) {
        const publishConnector = connector_1.ConnectorCompiler.publish(schema.publish, integration, this.props.policyPlugins, {
            mappableKeys: ["context", "path", "query", "body"],
        });
        const handler = (context, req, res) => tslib_1.__awaiter(this, void 0, void 0, function* () {
            const { params, query, body } = req;
            const mappableArgs = { context, path: params, query, body };
            const result = yield publishConnector(context, mappableArgs);
            this.sendResponse(res, result);
        });
        return new server_1.HTTPRoute({
            path,
            method,
            description: schema.description || null,
            handler,
        });
    }
    // TODO: REST plugin catalog
    describeSchema(schema) {
        return {};
    }
    sendResponse(res, result) {
        if (result === null || typeof result === "undefined") {
            res.status(200).end();
            return;
        }
        if (typeof result === "object") {
            const { $status, $headers, $body, createReadStream } = result, resultProps = tslib_1.__rest(result, ["$status", "$headers", "$body", "createReadStream"]);
            // response header modification
            if (typeof $headers === "object") {
                for (const [k, v] of Object.entries($headers)) {
                    if (typeof k !== "string") {
                        continue;
                    }
                    res.setHeader(k, v);
                }
            }
            // response code modification
            if (typeof $status === "number") {
                res.status($status);
            }
            // streaming support
            if (typeof createReadStream === "function") {
                const stream = createReadStream();
                if (!interface_1.isReadStream(stream)) {
                    throw new Error("invalid read stream"); // TODO: normalize error
                }
                if (!res.hasHeader("Content-Type")) {
                    res.setHeader("Content-Type", "application/octet-stream");
                }
                if (!res.hasHeader("Transfer-Encoding")) {
                    res.setHeader("Transfer-Encoding", "chunked");
                }
                stream.pipe(res);
                return;
            }
            // raw body response support (eg. with text/html content-type)
            if (typeof $body !== "undefined") {
                res.send($body);
                return;
            }
            // normal response as json
            res.json(resultProps);
            return;
        }
        res.status(200).send(result);
        return;
    }
}
exports.RESTProtocolPlugin = RESTProtocolPlugin;
RESTProtocolPlugin.key = "REST";
RESTProtocolPlugin.autoLoadOptions = {
    uploads: {
        maxFiles: Infinity,
        maxFileSize: Infinity,
    },
    introspection: true,
};
//# sourceMappingURL=plugin.js.map
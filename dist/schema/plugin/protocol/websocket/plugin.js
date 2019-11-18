"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const _ = tslib_1.__importStar(require("lodash"));
const interface_1 = require("../../../../interface");
const server_1 = require("../../../../server");
const connector_1 = require("../../connector");
const plugin_1 = require("../plugin");
const stream_1 = require("./stream");
class WebSocketProtocolPlugin extends plugin_1.ProtocolPlugin {
    constructor(props, opts) {
        super(props);
        this.props = props;
        this.opts = _.defaultsDeep(opts || {}, WebSocketProtocolPlugin.autoLoadOptions);
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
        const routePaths = [];
        return interface_1.validateObject(schema, {
            description: {
                type: "string",
            },
            basePath: {
                type: "custom",
                check(value) {
                    if (server_1.WebSocketRoute.isNonRootStaticPath(value)) {
                        return true;
                    }
                    return [{
                            type: "basePathInvalid",
                            field: "basePath",
                            actual: value,
                            expected: server_1.WebSocketRoute.nonRootStaticPathRegExp,
                            message: `basePath should be a valid non-root static path: eg. "/chat" | "/chat/lobby"`,
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
                        const { path, description, deprecated } = value, restProps = tslib_1.__rest(value, ["path", "description", "deprecated"]);
                        // path: string;
                        if (!server_1.WebSocketRoute.isNonRootDynamicPath(path) && !server_1.WebSocketRoute.isRootStaticPath(path)) {
                            return [{
                                    field: `routes[${idx}].path`,
                                    type: "routePathInvalid",
                                    actual: path,
                                    expected: [server_1.WebSocketRoute.nonRootDynamicPath, server_1.WebSocketRoute.rootStaticPathRegExp],
                                    message: `route path should be a valid path: eg. "/" | "/rooms" | "/rooms/:id"`,
                                }];
                        }
                        const errors = interface_1.validateObject(restProps, {
                            description: {
                                type: "string",
                                optional: true,
                            },
                            deprecated: {
                                type: "boolean",
                                optional: true,
                            },
                        }, {
                            strict: true,
                            field: `routes[${idx}]`,
                        });
                        if (errors.length === 0) {
                            // check duplicate path
                            if (routePaths.includes(path)) {
                                return [{
                                        field: `routes[${idx}].path`,
                                        type: "routePathDuplicate",
                                        actual: path,
                                        expected: undefined,
                                        message: `a route path should be unique"`,
                                    }];
                            }
                            routePaths.push(path);
                        }
                        // validate streaming route / pub-sub route
                        let rule;
                        if (typeof restProps.call !== "undefined") {
                            rule = {
                                type: "object",
                                strict: true,
                                props: {
                                    call: connector_1.ConnectorValidator.call,
                                },
                                messages: {
                                    objectStrict: "WebSocketStreamingRouteSchema cannot be with other connectors",
                                },
                            };
                        }
                        else if (typeof restProps.subscribe !== "undefined" || typeof restProps.publish !== "undefined") {
                            rule = {
                                type: "object",
                                strict: true,
                                props: {
                                    subscribe: connector_1.ConnectorValidator.subscribe,
                                    publish: connector_1.ConnectorValidator.publish,
                                    ignoreError: {
                                        type: "boolean",
                                        optional: true,
                                    },
                                },
                                messages: {
                                    objectStrict: "WebSocketPubSubRouteSchema cannot be with other connectors",
                                },
                            };
                        }
                        else {
                            errors.push({
                                type: "routeInvalid",
                                field: `routes[${idx}]`,
                                message: `WebSocket should have either publish/subscribe or call property`,
                                expected: "WebSocketPubSubRouteSchema | WebSocketStreamingRouteSchema",
                            });
                        }
                        errors.push(...interface_1.validateValue(restProps, 
                        // @ts-ignore
                        rule, {
                            strict: true,
                            field: `routes[${idx}]`,
                        }));
                        return errors;
                    },
                },
            },
        }, {
            strict: true,
        });
    }
    compileSchemata(routeHashMapCache, integrations) {
        const items = new Array();
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
                // compile new route
                const path = server_1.WebSocketRoute.mergePaths(schema.basePath, routeSchema.path);
                const route = typeof routeSchema.call !== "undefined"
                    ? this.createRouteFromWebSocketStreamingRouteScheme(path, routeSchema, integration)
                    : this.createRouteFromWebSocketPubSubRouteScheme(path, routeSchema, integration);
                items.push({ hash: routeHash, route });
            }
        }
        return items;
    }
    createRouteFromWebSocketPubSubRouteScheme(path, schema, integration) {
        const subscribeConnector = connector_1.ConnectorCompiler.subscribe(schema.subscribe, integration, this.props.policyPlugins, {
            mappableKeys: ["context", "path", "query"],
            getAsyncIterator: false,
        });
        const publishConnector = connector_1.ConnectorCompiler.publish(schema.publish, integration, this.props.policyPlugins, {
            mappableKeys: ["context", "path", "query", "message"],
        });
        const ignoreError = schema.ignoreError;
        const handler = (context, socket, req) => tslib_1.__awaiter(this, void 0, void 0, function* () {
            const { params, query } = req;
            // subscribe and proxy message to socket
            const mappableSubscriptionArgs = { context, path: params, query };
            yield subscribeConnector(context, mappableSubscriptionArgs, (message) => {
                if (typeof message !== "string") {
                    try {
                        message = JSON.stringify(message);
                    }
                    catch (_a) {
                    }
                }
                socket.send(message, error => {
                    if (error && ignoreError !== true) {
                        socket.emit("error", error);
                    }
                });
            });
            // publish received messages
            socket.on("message", (message) => tslib_1.__awaiter(this, void 0, void 0, function* () {
                // pub/sub route cannot receive binary message
                if (Buffer.isBuffer(message) || typeof message !== "string") {
                    throw new Error("unexpected message type"); // TODO: normalize error
                }
                else {
                    // parse text message
                    try {
                        message = JSON.parse(message);
                    }
                    catch (_a) {
                    }
                }
                const mappableArgs = { context, path: params, query, message };
                try {
                    yield publishConnector(context, mappableArgs);
                }
                catch (error) {
                    if (ignoreError !== true) {
                        socket.emit("error", error);
                    }
                }
            }));
        });
        return new server_1.WebSocketRoute({
            path,
            description: schema.description || null,
            handler,
        });
    }
    createRouteFromWebSocketStreamingRouteScheme(path, schema, integration) {
        const callConnector = connector_1.ConnectorCompiler.call(schema.call, integration, this.props.policyPlugins, {
            explicitMappableKeys: ["context", "path", "query"],
            implicitMappableKeys: ["path"],
            batchingEnabled: false,
            disableCache: true,
        });
        // const binary = schema.binary !== false;
        const handler = (context, socket, req) => tslib_1.__awaiter(this, void 0, void 0, function* () {
            const errorListeners = socket.listeners("error");
            try {
                // create websocket stream
                const clientStream = stream_1.createStreamFromWebSocket(socket, {
                    allowHalfOpen: false,
                    readableObjectMode: true,
                });
                // proxy stream error to socket error handler
                for (const listener of errorListeners) {
                    clientStream.on("error", (evt) => {
                        delete evt.target; // send except socket prop
                        listener(evt);
                    });
                }
                // call endpoint with client stream (client -> server)
                const { params, query } = req;
                const mappableArgs = { context, path: params, query };
                const result = yield callConnector(context, mappableArgs, {
                    // inject client websocket stream to broker delegator
                    createReadStream: () => clientStream,
                });
                // for bidirectional stream support (client <- server)
                if (result && typeof result.createReadStream === "function") {
                    const serverStream = result.createReadStream();
                    if (!interface_1.isReadStream(serverStream)) {
                        throw new Error("invalid stream response"); // TODO: normalize error
                    }
                    // read server stream then write to socket
                    serverStream.on("data", data => socket.send(data));
                }
                // other result props ignored
            }
            catch (error) {
                socket.emit("error", error);
            }
        });
        return new server_1.WebSocketRoute({
            path,
            description: schema.description || null,
            handler,
        });
    }
    describeSchema(schema) {
        // TODO: WebSocket Catalog
        return {};
    }
}
exports.WebSocketProtocolPlugin = WebSocketProtocolPlugin;
WebSocketProtocolPlugin.key = "WebSocket";
WebSocketProtocolPlugin.autoLoadOptions = {};
//# sourceMappingURL=plugin.js.map
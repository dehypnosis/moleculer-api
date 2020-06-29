"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ServerWebSocketApplication = void 0;
const tslib_1 = require("tslib");
const _ = tslib_1.__importStar(require("lodash"));
const ws_1 = tslib_1.__importDefault(require("ws"));
const url_1 = tslib_1.__importDefault(require("url"));
const qs_1 = tslib_1.__importDefault(require("qs"));
const context_1 = require("../../context");
const component_1 = require("../component");
const route_1 = require("./route");
class ServerWebSocketApplication extends component_1.ServerApplicationComponent {
    constructor(props, opts) {
        super(props);
        this.Route = route_1.WebSocketRoute;
        this.routeHandlerConnectionHandlersMap = new Map();
        this.opts = _.defaultsDeep(opts || {}, {
            perMessageDeflate: false,
            clientTracking: true,
            contextCreationTimeout: 100,
            pingPongCheckInterval: 5000,
        });
        const _a = this.opts, { contextCreationTimeout, pingPongCheckInterval } = _a, serverOpts = tslib_1.__rest(_a, ["contextCreationTimeout", "pingPongCheckInterval"]);
        // create WebSocket.Server without http.Server instance
        const server = new ws_1.default.Server(Object.assign(Object.assign({}, serverOpts), { noServer: true }));
        // attach upgrade handler which will be mounted as server protocols "upgrade" event handler
        const upgradeEventHandler = (req, tcpSocket, head) => {
            // handle upgrade with ws module and emit connection to web socket
            server.handleUpgrade(req, tcpSocket, head, socket => {
                // proxy socket error to server
                socket.on("error", error => {
                    if (server.listenerCount("error") > 0) {
                        server.emit("error", error, socket, req);
                    }
                    else {
                        this.props.logger.error(error);
                    }
                });
                // emit CONNECTION
                server.emit("connection", socket, req);
                if (socket.readyState !== socket.OPEN) { // close by middleware or somewhere
                    return;
                }
                // trick: if context not being created yet, assume it there are no matched handler
                if (context_1.APIRequestContext.isCreating(req)) {
                    // route matched, start ping-pong
                    socket.__isAlive = true;
                    socket.on("pong", () => {
                        socket.__isAlive = true;
                    });
                }
                else {
                    // route not matched throw error
                    const error = new Error("not found websocket route"); // TODO: normalize error
                    if (server.listenerCount("error") > 0) {
                        server.emit("error", error, socket, req);
                    }
                    else {
                        this.props.logger.error(error);
                    }
                    socket.close();
                }
            });
            // TERMINATE dangling sockets
            if (this.pingPongCheckIntervalTimer) {
                clearInterval(this.pingPongCheckIntervalTimer);
            }
            this.pingPongCheckIntervalTimer = setInterval(() => {
                server.clients.forEach(socket => {
                    if (socket.__isAlive === true) {
                        socket.__isAlive = false;
                        socket.ping();
                    }
                    else if (socket.__isAlive === false) {
                        socket.terminate();
                    }
                    else {
                        // do nothing when __isAlive is undefined yet
                    }
                });
            }, pingPongCheckInterval);
        };
        this.module = Object.assign(server, { upgradeEventHandler });
        this.module.setMaxListeners(100); // TODO: this number is quite arbitrary...
    }
    start() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            // ...
        });
    }
    stop() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            if (this.pingPongCheckIntervalTimer) {
                clearInterval(this.pingPongCheckIntervalTimer);
            }
            this.module.removeAllListeners();
            this.routeHandlerConnectionHandlersMap.clear();
        });
    }
    mountRoutes(routes, pathPrefixes, createContext) {
        // create new array to store connection handlers
        const connectionHandlers = [];
        // create routeHandlerMap for this routes
        const routeHandlerMap = new Map();
        // link routeHandlerMap to express.Router for the time to unmount
        this.routeHandlerConnectionHandlersMap.set(routeHandlerMap, connectionHandlers);
        // mount each routes
        for (const route of routes) {
            // internal handler should extract context and pass context to external handler
            const pathRegExps = route.getPathRegExps(pathPrefixes);
            // tslint:disable-next-line:no-shadowed-variable
            const routeHandler = (socket, req) => tslib_1.__awaiter(this, void 0, void 0, function* () {
                const { pathname, query } = url_1.default.parse(req.url || "/");
                for (const regExp of pathRegExps) {
                    const match = regExp.exec(pathname);
                    if (match) {
                        // create context
                        try {
                            const context = yield createContext(req);
                            socket.once("close", () => context.clear());
                            // req.params
                            req.params = route.paramKeys.reduce((obj, key, i) => {
                                obj[key.name] = match[i + 1];
                                return obj;
                            }, {});
                            // req.path
                            req.path = pathname;
                            // req.query
                            // use qs module to be along with http component: https://github.com/expressjs/express/blob/3ed5090ca91f6a387e66370d57ead94d886275e1/lib/middleware/query.js#L34
                            req.query = query ? qs_1.default.parse(query, { allowPrototypes: true }) : {};
                            // call handler
                            route.handler(context, socket, req);
                        }
                        catch (error) {
                            socket.emit("error", error);
                        }
                        break;
                    }
                }
            });
            // mount handler to ws.Server
            this.module.on("connection", routeHandler);
            this.props.logger.debug(`${route} mounted on ${pathPrefixes.join(", ")}`);
            // store connection handler to unmount later
            connectionHandlers.push(routeHandler);
            // store route and handler to map
            routeHandlerMap.set(route, routeHandler);
        }
        return routeHandlerMap;
    }
    unmountRoutes(routeHandlerMap) {
        const connectionHandlers = this.routeHandlerConnectionHandlersMap.get(routeHandlerMap);
        if (!connectionHandlers) {
            this.props.logger.error(`cannot find io.connectionHandlers matched for given RouteHandlerMap`, routeHandlerMap); // TODO: normalize error for all logger.error
            return;
        }
        // unmount connection handlers
        for (const handler of connectionHandlers) {
            this.module.removeListener("connection", handler);
        }
        // forget the routeHandlerMap
        this.routeHandlerConnectionHandlersMap.delete(routeHandlerMap);
    }
}
exports.ServerWebSocketApplication = ServerWebSocketApplication;
ServerWebSocketApplication.key = "ws";
//# sourceMappingURL=component.js.map
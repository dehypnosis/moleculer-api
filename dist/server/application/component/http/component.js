"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ServerHTTPApplication = void 0;
const tslib_1 = require("tslib");
const _ = tslib_1.__importStar(require("lodash"));
const express_1 = tslib_1.__importDefault(require("express"));
const component_1 = require("../component");
const route_1 = require("./route");
class ServerHTTPApplication extends component_1.ServerApplicationComponent {
    constructor(props, opts) {
        super(props);
        this.Route = route_1.HTTPRoute;
        this.routeHandlerExpressRouterMap = new Map();
        this.opts = _.defaultsDeep(opts || {}, {
            jsonSpaces: 2,
            trustProxy: true,
        });
        // create express.Application without http.Server instance
        this.module = express_1.default();
        Object.assign(this.module.settings, {
            "env": "production",
            "json spaces": this.opts.jsonSpaces || null,
            "case sensitive routing": false,
            "strict routing": false,
            "trust proxy": this.opts.trustProxy,
            "x-powered-by": false,
        });
        // modify use method to emit mount event
        const originalUse = this.module.use.bind(this.module);
        this.module.use = (...args) => {
            const result = originalUse(...args);
            this.module.emit("update");
            return result;
        };
    }
    /* lifecycle */
    start() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            // ...
        });
    }
    stop() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            this.routeHandlerExpressRouterMap.clear();
        });
    }
    mountRoutes(routes, pathPrefixes, createContext) {
        // create new express.Router for given routes and mount to express.Application
        const expressRouter = express_1.default.Router();
        this.module.use(expressRouter);
        // create routeHandlerMap for this routes
        const routeHandlerMap = new Map();
        // link routeHandlerMap to express.Router for the time to unmount
        this.routeHandlerExpressRouterMap.set(routeHandlerMap, expressRouter);
        // mount each routes
        for (const route of routes) {
            let expressRouterMount = expressRouter.all;
            switch (route.method) {
                case "PATCH":
                    expressRouterMount = expressRouter.patch;
                    break;
                case "GET":
                    expressRouterMount = expressRouter.get;
                    break;
                case "DELETE":
                    expressRouterMount = expressRouter.delete;
                    break;
                case "POST":
                    expressRouterMount = expressRouter.post;
                    break;
                case "PUT":
                    expressRouterMount = expressRouter.put;
                    break;
                default:
                    this.props.logger.error(`cannot mount route: ${route}`); // TODO: normalize error
                    continue;
            }
            expressRouterMount = expressRouterMount.bind(expressRouter);
            // internal handler should extract context and pass context to external handler
            const routeHandler = (req, res, next) => tslib_1.__awaiter(this, void 0, void 0, function* () {
                try {
                    // create context
                    const context = yield createContext(req);
                    res.once("finish", () => context.clear());
                    // req.params
                    req.params = route.paramKeys.reduce((obj, key, i) => {
                        obj[key.name] = req.params[i];
                        return obj;
                    }, {});
                    // call handler
                    yield route.handler(context, req, res);
                }
                catch (error) {
                    next(error);
                }
            });
            // mount handler into router
            const pathRegExps = route.getPathRegExps(pathPrefixes);
            for (const regExp of pathRegExps) {
                expressRouterMount(regExp, routeHandler);
            }
            this.props.logger.debug(`${route} mounted on ${pathPrefixes.join(", ")}`);
            // store route and handler to map
            routeHandlerMap.set(route, routeHandler);
        }
        return routeHandlerMap;
    }
    unmountRoutes(routeHandlerMap) {
        const expressRouter = this.routeHandlerExpressRouterMap.get(routeHandlerMap);
        if (!expressRouter) {
            this.props.logger.error(`cannot find express.Router matched for given RouteHandlerMap`, routeHandlerMap);
            return;
        }
        // unmount express.Router
        this.unmountExpressRouter(expressRouter);
        // forget the routeHandlerMap
        this.routeHandlerExpressRouterMap.delete(routeHandlerMap);
    }
    unmountExpressRouter(expressRouter, layers = this.module._router.stack) {
        for (let i = layers.length - 1; i >= 0; i--) {
            const layer = layers[i];
            if (layer.handle === expressRouter) {
                layers.splice(i, 1);
            }
            else if (layer.route) {
                this.unmountExpressRouter(expressRouter, layer.route.stack);
                if (layer.route.stack.length === 0) {
                    layers.splice(i, 1);
                }
            }
        }
    }
}
exports.ServerHTTPApplication = ServerHTTPApplication;
ServerHTTPApplication.key = "http";
//# sourceMappingURL=component.js.map
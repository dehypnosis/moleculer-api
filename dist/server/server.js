"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.APIServer = void 0;
const tslib_1 = require("tslib");
const kleur = tslib_1.__importStar(require("kleur"));
const lodash_1 = tslib_1.__importDefault(require("lodash"));
const application_1 = require("./application");
const middleware_1 = require("./middleware");
const protocol_1 = require("./protocol");
class APIServer {
    constructor(props, opts) {
        this.props = props;
        // adjust options
        this.opts = lodash_1.default.defaultsDeep(opts || {}, {
            update: {
                debouncedSeconds: 2,
                maxDebouncedSeconds: 5,
            },
            application: {},
            context: application_1.defaultAPIRequestContextFactoryConstructorOptions,
            middleware: {},
            protocol: protocol_1.defaultServerProtocolConstructorOptions,
        });
        this.opts.update.debouncedSeconds = isNaN(this.opts.update.debouncedSeconds) ? 2 : Math.max(this.opts.update.debouncedSeconds, 0);
        this.opts.update.maxDebouncedSeconds = isNaN(this.opts.update.maxDebouncedSeconds) ? 5 : Math.max(this.opts.update.maxDebouncedSeconds, this.opts.update.debouncedSeconds, 1);
        // create context factory
        const contextFactories = Object.entries(this.opts.context)
            .reduce((factories, [k, options]) => {
            const key = k;
            if (options !== false) {
                factories.push(new (application_1.APIRequestContextFactoryConstructors[key])({
                    logger: this.props.logger.getChild(`context/${key}`),
                }, options));
            }
            return factories;
        }, []);
        this.props.logger.info(`gateway context factories have been applied ${contextFactories.join(", ")}`);
        // create application
        this.app = new application_1.ServerApplication({
            logger: this.props.logger.getChild(`application`),
            contextFactories,
        }, this.opts.application);
        // override middleware options
        const middlewareKeyAndOptions = [];
        for (const [k, defaultOptions] of Object.entries(middleware_1.defaultServerMiddlewareConstructorOptions)) {
            const key = k;
            const overriding = this.opts.middleware[key];
            if (typeof overriding !== "undefined") {
                middlewareKeyAndOptions.push([key, overriding ? lodash_1.default.defaultsDeep(overriding, defaultOptions) : overriding]);
            }
            else {
                middlewareKeyAndOptions.push([key, defaultOptions]);
            }
        }
        // create middleware
        const middleware = middlewareKeyAndOptions
            .filter(([key, options]) => options !== false)
            .map(([key, options]) => {
            return new (middleware_1.ServerMiddlewareConstructors[key])({
                logger: this.props.logger.getChild(`middleware/${key}`),
            }, options);
        });
        // apply application middleware
        for (const middle of middleware) {
            middle.apply(this.app.componentModules);
        }
        this.props.logger.info(`gateway server middleware have been applied: ${middleware.join(", ")}`);
        // create protocol
        this.protocols = Object.entries(this.opts.protocol)
            .reduce((protocols, [k, options]) => {
            const key = k;
            if (options !== false) {
                protocols.push(new (protocol_1.ServerProtocolConstructors[key])({
                    logger: this.props.logger.getChild(`protocol/${key}`),
                }, options));
            }
            return protocols;
        }, []);
    }
    /* lifecycle */
    start() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            // start application
            yield this.app.start();
            // make server protocol listen
            const listeningURIs = [];
            for (const protocol of this.protocols) {
                listeningURIs.push(...(yield protocol.start(this.app.componentModules)));
            }
            this.props.logger.info(`gateway server protocol has been started: ${this.protocols.join(", ")}`);
            if (listeningURIs.length > 0) {
                this.props.logger.info(`gateway server has been started and listening on: ${kleur.blue(kleur.bold(listeningURIs.join(", ")))}`);
            }
            else {
                this.props.logger.error(`gateway server has been started but there are ${kleur.red("no bound network interfaces")}`);
            }
            // start schema registry and connect handler update methods
            const debouncedBranchUpdateHandlers = new Map();
            const debouncedBranchRemovedHandlers = new Map();
            yield this.props.schema.start({
                // enhance 'updated', 'removed' handler to be debounced for each of branches
                updated: (branch) => {
                    let handler = debouncedBranchUpdateHandlers.get(branch);
                    if (!handler) {
                        handler = lodash_1.default.debounce(() => {
                            return this.app.mountBranchHandler(branch);
                        }, 1000 * this.opts.update.debouncedSeconds, { maxWait: 1000 * this.opts.update.maxDebouncedSeconds });
                        debouncedBranchUpdateHandlers.set(branch, handler);
                    }
                    return handler();
                },
                removed: (branch) => {
                    let handler = debouncedBranchRemovedHandlers.get(branch);
                    if (!handler) {
                        handler = lodash_1.default.debounce(() => {
                            return this.app.unmountBranchHandler(branch)
                                .finally(() => {
                                debouncedBranchUpdateHandlers.delete(branch);
                                debouncedBranchRemovedHandlers.delete(branch);
                            });
                        }, 1000 * this.opts.update.debouncedSeconds, { maxWait: 1000 * this.opts.update.maxDebouncedSeconds });
                        debouncedBranchRemovedHandlers.set(branch, handler);
                    }
                    return handler();
                },
            });
            // add information route for debugging
            // this.app.addStaticRoute(
            //   new HTTPRoute({
            //     path: "/~",
            //     method: "GET",
            //     description: "",
            //     handler: (ctx, req, res) => {
            //       res.json(this.props.schema.information);
            //     },
            //   }),
            // );
        });
    }
    stop() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            // stop application
            yield this.app.stop();
            for (const protocol of this.protocols) {
                yield protocol.stop();
                this.props.logger.info(`gateway server protocol has been stopped: ${protocol}`);
            }
            this.props.logger.info(`gateway server has been stopped`);
            // stop schema registry
            yield this.props.schema.stop();
        });
    }
}
exports.APIServer = APIServer;
//# sourceMappingURL=server.js.map
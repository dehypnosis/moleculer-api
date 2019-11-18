"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const async_lock_1 = tslib_1.__importDefault(require("async-lock"));
const error_1 = require("tslint/lib/error");
const component_1 = require("./component");
const context_1 = require("./context");
class ServerApplication {
    constructor(props, opts) {
        this.props = props;
        this.componentBranchHandlerMap = new Map();
        this.componentsAliasedVersions = new Map();
        /* handler update */
        this.lock = new async_lock_1.default({ maxPending: 1000, timeout: 1000 });
        // create application components
        this.components = Object.entries(component_1.ServerApplicationComponentConstructors).reduce((components, [compKey, Component]) => {
            const key = compKey;
            return components.concat(new Component({
                logger: this.props.logger.getChild(`${key}`),
            }, opts && opts[key]));
        }, []);
        // create branch handler map for each components
        for (const component of this.components) {
            this.componentBranchHandlerMap.set(component, new Map());
            this.componentsAliasedVersions.set(component, []);
        }
    }
    // modules map of each application components which are passed to protocols
    get componentModules() {
        return this.components.reduce((obj, component) => {
            obj[component.key] = component.module;
            return obj;
        }, {});
    }
    /* lifecycle */
    start() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            for (const component of this.components) {
                yield component.start();
            }
            this.props.logger.info(`gateway server application has been started: ${this.components.join(", ")}`);
        });
    }
    stop() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            for (const component of this.components) {
                yield component.stop();
            }
            this.componentBranchHandlerMap.clear();
            this.props.logger.info(`gateway server application has been stopped: ${this.components.join(", ")}`);
        });
    }
    mountBranchHandler(branch) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield Promise.all(this.components.map((component) => tslib_1.__awaiter(this, void 0, void 0, function* () {
                return this.lock.acquire(component.key, () => {
                    // get version handler map
                    const branchHandlerMap = this.componentBranchHandlerMap.get(component);
                    const versionHandlerMap = branchHandlerMap.get(branch) || new Map();
                    // get aliases versions
                    const aliasedVersions = this.componentsAliasedVersions.get(component);
                    // unmount old versions
                    const newVersions = branch.versions; // latest -> oldest versions
                    for (const [version, routeHandlerMap] of versionHandlerMap.entries()) {
                        // clear forgotten version or prev-latest version
                        if (!newVersions.includes(version) || aliasedVersions.includes(version)) {
                            component.unmountRoutes(routeHandlerMap);
                            versionHandlerMap.delete(version);
                        }
                    }
                    // prepare context creation
                    const createContext = context_1.APIRequestContext.createConstructor(this.props.contextFactories, {
                        before(source) {
                            branch.touch();
                            // console.log("create context with ", source);
                        },
                    });
                    // mount new versions
                    for (const version of newVersions) {
                        if (!versionHandlerMap.has(version)) {
                            // prepare mount path
                            const { branchPathPrefix, versionPathPrefix } = component_1.Route;
                            const pathPrefixes = [`/${branchPathPrefix}${branch.name}${versionPathPrefix}${version.shortHash}`]; // ~dev@abcd1234
                            if (branch.latestVersion === version) {
                                pathPrefixes.unshift(`/${branchPathPrefix}${branch.name}`); // ~dev
                                if (branch.isMaster) {
                                    pathPrefixes.unshift(`/`);
                                }
                                // remember aliased versions to unmount it later when alias should be removed
                                aliasedVersions.push(version);
                            }
                            // create route handlers and mount
                            const routes = version.routes.filter(component.canHandleRoute.bind(component));
                            const routeHandlerMap = component.mountRoutes(routes, pathPrefixes, createContext);
                            versionHandlerMap.set(version, routeHandlerMap);
                        }
                    }
                    branchHandlerMap.set(branch, versionHandlerMap);
                    this.props.logger.info(`${branch} handler mounted for ${component} component`);
                })
                    .catch(error => {
                    if (error instanceof error_1.FatalError) {
                        throw error;
                    }
                    this.props.logger.error(`failed to mount ${branch} handler for ${component}: ${error}`);
                });
            })));
            // tslint:disable-next-line:no-shadowed-variable
            // this.props.logger.info("\n" + this.routes.map(({branch, version, route}) => `/~${branch.name}@${version.shortHash}${route}`).join("\n"));
        });
    }
    unmountBranchHandler(branch) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield Promise.all(this.components.map((component) => tslib_1.__awaiter(this, void 0, void 0, function* () {
                return this.lock.acquire(component.key, () => {
                    // get branch handlers map
                    const branchHandlerMap = this.componentBranchHandlerMap.get(component);
                    if (!branchHandlerMap) {
                        return;
                    }
                    const versionHandlerMap = branchHandlerMap.get(branch);
                    if (!versionHandlerMap) {
                        return;
                    }
                    // remove all version handlers
                    for (const [version, routeHandlerMap] of versionHandlerMap.entries()) {
                        component.unmountRoutes(routeHandlerMap);
                        versionHandlerMap.delete(version);
                    }
                    // clear resources
                    versionHandlerMap.clear();
                    branchHandlerMap.delete(branch);
                    this.props.logger.info(`${branch} handler unmounted for ${component}`);
                })
                    .catch(error => {
                    if (error instanceof error_1.FatalError) {
                        throw error;
                    }
                    this.props.logger.info(`failed to unmount ${branch} handler for ${component}`, error);
                });
            })));
        });
    }
    get routes() {
        const items = [];
        for (const branchHandlerMap of this.componentBranchHandlerMap.values()) {
            for (const [branch, versionHandlerMap] of branchHandlerMap.entries()) {
                for (const [version, routeHandlerMap] of versionHandlerMap.entries()) {
                    for (const route of routeHandlerMap.keys()) {
                        items.push({ branch, version, route });
                    }
                }
            }
        }
        return items;
    }
}
exports.ServerApplication = ServerApplication;
//# sourceMappingURL=application.js.map
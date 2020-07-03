"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Branch = void 0;
const tslib_1 = require("tslib");
const async_lock_1 = tslib_1.__importDefault(require("async-lock"));
const events_1 = require("events");
const kleur = tslib_1.__importStar(require("kleur"));
const _ = tslib_1.__importStar(require("lodash"));
const error_1 = require("tslint/lib/error");
const broker_1 = require("../broker");
const catalog_1 = require("./catalog");
const integration_1 = require("./integration");
const version_1 = require("./version");
const { Add, Remove } = integration_1.ServiceAPIIntegration.Type;
class Branch {
    constructor(props, opts) {
        this.props = props;
        this.emitter = new events_1.EventEmitter().setMaxListeners(1);
        /* garbage detector */
        this.latestUsedAt = new Date();
        // setup initial or forked branch
        this.serviceCatalog = props.serviceCatalog || new catalog_1.ServiceCatalog();
        this.$latestVersion = props.parentVersion || version_1.Version.initialVersion;
        // forget it
        delete props.serviceCatalog;
        delete props.parentVersion;
        // adjust options
        this.opts = _.defaultsDeep(opts || {}, {
            maxVersions: 10,
            maxUnusedSeconds: 60 * 30,
        });
        this.opts.maxVersions = isNaN(this.opts.maxVersions) ? 10 : Math.max(this.opts.maxVersions, 1);
        this.opts.maxUnusedSeconds = isNaN(this.opts.maxUnusedSeconds) ? 60 * 30 : Math.max(this.opts.maxUnusedSeconds, 1);
    }
    toString() {
        return `${kleur.bold(kleur.cyan(this.name))} ${kleur.cyan(`(${this.serviceCatalog.size} services)`)}`;
    }
    get information() {
        return {
            branch: this.name,
            latestUsedAt: this.latestUsedAt,
            services: this.serviceCatalog.services.map(service => service.information),
            parentVersion: this.props.parentVersion ? this.props.parentVersion.shortHash : null,
            latestVersion: this.$latestVersion.shortHash,
            versions: this.versions.map(v => v.information),
        };
    }
    ;
    get name() {
        return this.props.name;
    }
    get isMaster() {
        return this.name === Branch.Master;
    }
    get isUnused() {
        return this.unusedSeconds > this.opts.maxUnusedSeconds;
    }
    get unusedSeconds() {
        return Math.floor((new Date().getTime() - this.latestUsedAt.getTime()) / 1000);
    }
    touch() {
        this.latestUsedAt = new Date();
    }
    /* services */
    get services() {
        return this.serviceCatalog.services;
    }
    /* versions */
    get latestVersion() {
        return this.$latestVersion;
    }
    get versions() {
        const versions = [];
        let version = this.$latestVersion;
        do {
            versions.push(version);
            version = version.parentVersion;
        } while (version);
        return versions;
    }
    fork(props) {
        // wait until queue empty and all on-going integration be progressed
        return Branch.lock.acquire(props.name, () => {
            return Branch.lock.acquire(this.name, () => {
                return new Branch(Object.assign(Object.assign({}, this.props), { name: props.name, logger: props.logger, parentVersion: this.$latestVersion, serviceCatalog: this.serviceCatalog.clone() }), this.opts);
            });
        });
    }
    /*
      service discovery priority rule:
      master branch can see and prefer: master-branched > non-branched services
      other branch can see and prefer: own-branched > master-branched > non-branched services
    */
    connectService(service, integration) {
        return Branch.lock.acquire(this.name, () => {
            let priority;
            if (!integration) {
                priority = 1;
            }
            else if (integration.schema.branch === Branch.Master) {
                priority = 2;
            }
            else if (integration.schema.branch === this.name) {
                priority = 3;
            }
            else {
                this.props.logger.info(`${this} branch ignores ${service} service connection`);
                return;
            }
            // update service catalog
            const oldItem = this.serviceCatalog.get(service.id);
            this.serviceCatalog.add({ service, integration, priority });
            const newItem = this.serviceCatalog.get(service.id);
            // on preferred service changes
            if (oldItem !== newItem) {
                if (oldItem) {
                    this.props.logger.info(`${this} branch replaced ${oldItem.service} => ${newItem.service} service`);
                }
                else {
                    this.props.logger.info(`${this} branch added ${newItem.service} service`);
                }
                // integrate API if has
                const integrations = [];
                if (oldItem && oldItem.integration) {
                    integrations.push(new integration_1.ServiceAPIIntegration({
                        type: Remove,
                        serviceCatalog: this.serviceCatalog,
                        source: oldItem.integration,
                    }));
                }
                if (newItem.integration) {
                    integrations.push(new integration_1.ServiceAPIIntegration({
                        type: Add,
                        serviceCatalog: this.serviceCatalog,
                        source: newItem.integration,
                    }));
                }
                if (integrations.length > 0) {
                    return this.consumeIntegrations(integrations);
                }
            }
        });
    }
    disconnectService(service) {
        return Branch.lock.acquire(this.name, () => tslib_1.__awaiter(this, void 0, void 0, function* () {
            const oldItem = this.serviceCatalog.get(service.id);
            if (!this.serviceCatalog.remove(service)) {
                this.props.logger.info(`${this} branch ignores ${service} service disconnection`);
                return;
            }
            this.props.logger.info(`${this} branch disconnected ${oldItem.service} service`);
            const newItem = this.serviceCatalog.get(service.id);
            // assert: preferred service changed or all the service connections has been removed
            console.assert(oldItem !== newItem);
            if (newItem) {
                this.props.logger.info(`${this} branch replaced ${oldItem.service} => ${newItem.service} service`);
            }
            else {
                this.props.logger.info(`${this} branch removed ${oldItem.service} service`);
            }
            // integrate API if has
            const integrations = [];
            if (oldItem.integration) {
                integrations.push(new integration_1.ServiceAPIIntegration({
                    type: Remove,
                    serviceCatalog: this.serviceCatalog,
                    source: oldItem.integration,
                }));
            }
            if (newItem && newItem.integration) {
                integrations.push(new integration_1.ServiceAPIIntegration({
                    type: Add,
                    serviceCatalog: this.serviceCatalog,
                    source: newItem.integration,
                }));
            }
            if (integrations.length > 0) {
                yield this.consumeIntegrations(integrations);
            }
        }));
    }
    /* schema integration */
    consumeIntegrations(integrations, initialCompile = false) {
        var _a;
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            try {
                const parentVersion = this.$latestVersion;
                // get queue jobs and filter add/remove pairs
                const compensatedIntegrations = integrations.filter(integration => {
                    return integrations
                        .some(int => int.schemaHash === integration.schemaHash && (int.type === Add && integration.type === Remove || int.type === Remove && integration.type === Add));
                });
                if (compensatedIntegrations.length > 0) {
                    for (const integration of compensatedIntegrations) {
                        integrations.splice(integrations.indexOf(integration), 1);
                        integration.setSkipped(this, parentVersion);
                    }
                    this.props.logger.info(`${this} branch will skip to integrate complementary integrations:\n${compensatedIntegrations.join("\n")}`);
                }
                // retry failed jobs or finish
                if (integrations.length === 0 && !initialCompile) {
                    return this.retryFailedIntegrationsFrom(parentVersion);
                }
                // create new schemaHashMap and pick up required schemata to compile
                const { schemaHashMap, routeHashMapCache } = parentVersion.getChildVersionProps();
                let shouldCompile = initialCompile;
                for (const integration of integrations) {
                    if (integration.type === Add) {
                        if (!schemaHashMap.has(integration.schemaHash) || integration.status === integration_1.ServiceAPIIntegration.Status.Failed) {
                            shouldCompile = true;
                        }
                        else {
                            // this.props.logger.warn(`${integration.schemaHash} is not the part of ${[...schemaHashMap.keys()]}`);
                        }
                        schemaHashMap.set(integration.schemaHash, integration); // override schema
                    }
                    else if (integration.type === Remove) {
                        if (schemaHashMap.has(integration.schemaHash) || integration.status === integration_1.ServiceAPIIntegration.Status.Failed) {
                            shouldCompile = true;
                            schemaHashMap.delete(integration.schemaHash); // remove
                        }
                        else {
                            // this.props.logger.warn(`${integration.schemaHash} is not the part of ${[...schemaHashMap.keys()]}`);
                        }
                    }
                    else {
                        console.assert(false, "invalid integration type");
                    }
                }
                // no changes
                if (!shouldCompile) {
                    for (const integration of integrations) {
                        integration.setSkipped(this, parentVersion);
                    }
                    this.props.logger.info(`${this} branch skipped ${parentVersion} -> (new) version compile due to no changes:\n${integrations.concat(compensatedIntegrations).join("\n")}`);
                    // retry
                    return this.retryFailedIntegrationsFrom(parentVersion);
                }
                // compile new schemata as new routeHashMap
                const mergedIntegrations = Array.from(schemaHashMap.values());
                const routeHashes = new Array();
                const routes = new Array();
                const errors = [];
                for (const plugin of this.props.protocolPlugins) {
                    try {
                        const pluginIntegrations = mergedIntegrations.filter(integration => integration.schema.protocol && integration.schema.protocol[plugin.key]);
                        const pluginResult = plugin.compileSchemata(routeHashMapCache, pluginIntegrations);
                        for (const { hash, route } of pluginResult) {
                            const routeHashIndex = routeHashes.indexOf(hash);
                            if (routeHashIndex !== -1) {
                                const existingRoute = routes[routeHashIndex];
                                errors.push({
                                    type: "routeHashCollision",
                                    field: `api.protocol.${plugin.key}`,
                                    message: `route hash [${hash}] collision occurred between ${existingRoute} and ${route} in ${this.name} branch`,
                                });
                                continue;
                            }
                            const conflictRoute = routes.find(r => r.isConflict(route));
                            if (conflictRoute) {
                                errors.push({
                                    type: "routeConflict",
                                    field: `api.protocol.${plugin.key}`,
                                    message: `route conflict occurred between ${conflictRoute} and ${route} in ${this.name} branch`,
                                });
                                continue;
                            }
                            routeHashes.push(hash);
                            routes.push(route);
                        }
                    }
                    catch (error) {
                        errors.push({
                            type: "compileError",
                            field: `api.protocol.${plugin.key}`,
                            message: error.message,
                        });
                    }
                }
                // failed: report errors and process as failed jobs
                if (errors.length > 0) {
                    for (const integration of integrations) {
                        integration.setFailed(this, parentVersion, errors);
                    }
                    if (initialCompile) { // throw errors when failed in initial compile
                        throw new error_1.FatalError("failed to compile empty schemata initially", errors); // TODO: normalize error
                    }
                    else {
                        const at = new Date();
                        const errorsTable = broker_1.Reporter.getTable(errors.map(message => ({ type: "error", message, at })));
                        this.props.logger.error(`${this} branch failed ${parentVersion} -> (new) version compile:\n${integrations.join("\n")}${errorsTable}`);
                    }
                    // will not retry on failure
                    return;
                }
                // succeed: report success and create new version
                const routeHashMap = new Map(routeHashes.map((hash, idx) => [hash, routes[idx]]));
                // create new version
                const version = new version_1.Version({
                    schemaHashMap,
                    routeHashMap,
                    parentVersion,
                });
                this.$latestVersion = version;
                // report to origin services
                const updatedRoutes = [];
                const removedRoutes = [];
                for (const [hash, route] of routeHashMap) {
                    if (!routeHashMapCache.has(hash)) {
                        updatedRoutes.push(route);
                    }
                }
                for (const [hash, route] of routeHashMapCache) {
                    if (!routeHashMap.has(hash)) {
                        removedRoutes.push(route);
                    }
                }
                updatedRoutes.sort((a, b) => a.path > b.path && a.protocol > b.protocol ? 1 : 0);
                removedRoutes.sort((a, b) => a.path > b.path && a.protocol > b.protocol ? 1 : 0);
                const routeIntegrations = [];
                for (const r of removedRoutes) {
                    routeIntegrations.push(kleur.dim(`(-) ${r.toStringWithoutDescription()}`));
                }
                for (const r of updatedRoutes) {
                    routeIntegrations.push(`(+) ${r}`);
                }
                for (const integration of integrations) {
                    integration.setSucceed(this, version, routeIntegrations);
                }
                // log
                this.props.logger.info(`${this} branch succeeded ${parentVersion} -> ${version} version compile:\n${[...integrations, ...routeIntegrations].join("\n")}`);
                // forget old parent versions if need
                for (let cur = this.$latestVersion, parent = cur.parentVersion, i = 1; parent; cur = parent, parent = cur.parentVersion, i++) {
                    // v1 / v2 / 1
                    // v2 / v3 / 2
                    // v3 / null / 3
                    if (i >= this.opts.maxVersions) {
                        // for (const integration of parent.integrations) {
                        //   integration.reportRemoved(this, cur);
                        // }
                        (_a = parent.integrations[0]) === null || _a === void 0 ? void 0 : _a.reportRemoved(this, cur);
                        cur.forgetParentVersion();
                        this.props.logger.info(`${this} branch have forgotten versions older than ${cur}`);
                        break;
                    }
                }
                // emit routes update event
                this.emitter.emit(Branch.Event.Updated);
                // retry failed jobs or finish
                return this.retryFailedIntegrationsFrom(parentVersion);
            }
            catch (error) {
                if (error instanceof error_1.FatalError) {
                    throw error;
                }
                this.props.logger.error(`${this} branch failed to process integration jobs:\n${integrations.join("\n")}`, error);
            }
        });
    }
    retryFailedIntegrationsFrom(version) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            // retry merging failed integrations from history
            const retryableIntegrations = version.getRetryableIntegrations();
            if (retryableIntegrations.length > 0) {
                this.props.logger.info(`${this} branch will retry merging ${retryableIntegrations.length} failed integrations:\n${retryableIntegrations.join("\n")}`);
                return this.consumeIntegrations(retryableIntegrations, false);
            }
        });
    }
    /* lifecycle (updated/removed) */
    start(listener) {
        return Branch.lock.acquire(this.name, () => {
            this.emitter.on(Branch.Event.Updated, listener.updated);
            this.emitter.on(Branch.Event.Removed, listener.removed);
            listener.started();
            // force compile for master branch initialization
            if (this.isMaster) {
                return this.consumeIntegrations([], true);
            }
        });
    }
    stop() {
        return Branch.lock.acquire(this.name, () => {
            // report version removed
            for (const version of this.versions) {
                for (const integration of version.integrations) {
                    integration.reportRemoved(this, version);
                }
            }
            this.emitter.emit(Branch.Event.Removed);
            this.emitter.removeAllListeners();
        });
    }
}
exports.Branch = Branch;
Branch.Master = "master";
Branch.Event = {
    Updated: "updated",
    Removed: "removed",
};
Branch.lock = new async_lock_1.default({ maxPending: 1000, timeout: 30 * 1000 });
//# sourceMappingURL=branch.js.map
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SchemaRegistry = void 0;
const tslib_1 = require("tslib");
const events_1 = require("events");
const async_lock_1 = tslib_1.__importDefault(require("async-lock"));
const kleur = tslib_1.__importStar(require("kleur"));
const lodash_1 = tslib_1.__importDefault(require("lodash"));
const error_1 = require("tslint/lib/error");
const interface_1 = require("../interface");
const broker_1 = require("../broker");
const branch_1 = require("./branch");
const plugin_1 = require("./plugin");
class SchemaRegistry {
    constructor(props, opts) {
        this.props = props;
        this.branchMap = new Map();
        this.emitter = new events_1.EventEmitter().setMaxListeners(1);
        /* service discovery */
        this.lock = new async_lock_1.default({ maxPending: 1000, timeout: 30 * 1000 });
        this.serviceReporterMap = new Map();
        // adjust options
        this.branchOptions = opts && opts.branch;
        const { protocol = {}, policy = {} } = opts || {};
        const pluginConstructorOptions = lodash_1.default.defaultsDeep({ protocol, policy }, plugin_1.defaultSchemaPluginConstructorOptions);
        // initiate all plugins
        this.plugin = { protocol: [], policy: [] };
        for (const [pluginKey, pluginOptions] of Object.entries(pluginConstructorOptions.policy)) {
            if (pluginOptions === false) {
                continue;
            }
            const PluginConstructor = plugin_1.SchemaPluginConstructors.policy[pluginKey];
            if (!PluginConstructor) {
                continue;
            }
            this.plugin.policy.push(new PluginConstructor({
                logger: this.props.logger.getChild(`policy/${pluginKey}`),
            }, pluginOptions));
        }
        for (const [pluginKey, pluginOptions] of Object.entries(pluginConstructorOptions.protocol)) {
            if (pluginOptions === false) {
                continue;
            }
            const PluginConstructor = plugin_1.SchemaPluginConstructors.protocol[pluginKey];
            if (!PluginConstructor) {
                continue;
            }
            this.plugin.protocol.push(new PluginConstructor({
                logger: this.props.logger.getChild(`protocol/${pluginKey}`),
                policyPlugins: this.plugin.policy,
            }, pluginOptions ? pluginOptions : undefined));
        }
    }
    /* registry lifecycle */
    start(listeners) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            // start plugins
            for (const plugin of this.plugin.policy) {
                yield plugin.start();
            }
            this.props.logger.info(`schema policy plugin has been started: ${this.plugin.policy.join(", ")}`);
            for (const plugin of this.plugin.protocol) {
                yield plugin.start();
            }
            this.props.logger.info(`schema protocol plugin has been started: ${this.plugin.protocol.join(", ")}`);
            // initialize branch event handler
            this.emitter.on(SchemaRegistry.Event.Updated, listeners.updated);
            this.emitter.on(SchemaRegistry.Event.Removed, listeners.removed);
            // initialize unused branch clearer
            this.clearUnusedBranchesIntervalTimer = setInterval(this.clearUnusedBranches.bind(this), 5 * 1000);
            // start master branch
            yield this.findOrCreateBranch(branch_1.Branch.Master);
            this.props.logger.info("schema registry has been started");
            // start brokers and initialize discovery handler
            for (const broker of this.props.brokers) {
                yield broker.start({
                    connected: this.serviceConnected.bind(this),
                    disconnected: this.serviceDisconnected.bind(this),
                    nodePoolUpdated: this.serviceNodePoolUpdated.bind(this),
                });
            }
        });
    }
    stop() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            // clear resources
            if (this.clearUnusedBranchesIntervalTimer) {
                clearInterval(this.clearUnusedBranchesIntervalTimer);
            }
            this.emitter.removeAllListeners();
            this.branchMap.clear();
            // stop branches
            for (const branch of this.getBranches()) {
                yield branch.stop();
            }
            // stop plugins
            for (const plugin of [...this.plugin.protocol, ...this.plugin.policy]) {
                yield plugin.stop();
            }
            this.props.logger.info("schema registry has been stopped");
            // stop broker and clear discovery handler
            for (const broker of this.props.brokers) {
                yield broker.stop();
            }
        });
    }
    serviceConnected(service) {
        this.lock.acquire("discovery", () => tslib_1.__awaiter(this, void 0, void 0, function* () {
            this.props.logger.info(`${service} service has been connected`);
            const reporter = service.broker.createReporter(service);
            this.serviceReporterMap.set(service, reporter);
            let integration = null;
            const meta = service.meta;
            // if has published service API
            if (meta && meta.api) {
                // validate service API schema
                const schema = meta.api;
                const errors = this.validateServiceAPISchema(schema);
                if (errors.length > 0) {
                    errors.forEach(err => reporter.error(err));
                    const at = new Date();
                    const errorsTable = broker_1.Reporter.getTable(errors.map(message => ({ type: "error", message, at })));
                    this.props.logger.error(`failed to validate ${service} API schema: ${errorsTable}`);
                }
                else {
                    // create integration source
                    integration = { schema, schemaHash: this.hashServiceAPISchema(schema), service, reporter };
                    // assure new branch creation
                    yield this.findOrCreateBranch(schema.branch);
                }
            }
            // connect service to each branches' latest version
            for (const branch of this.branchMap.values()) {
                yield branch.connectService(service, integration);
            }
        }))
            .catch(error => {
            if (error instanceof error_1.FatalError)
                throw error;
            this.props.logger.error(`failed to connect ${service} service`, error);
        });
    }
    serviceDisconnected(service) {
        this.lock.acquire("discovery", () => tslib_1.__awaiter(this, void 0, void 0, function* () {
            this.props.logger.info(`${service} service has been disconnected`);
            // disconnect service from each branches' latest version
            for (const branch of this.branchMap.values()) {
                yield branch.disconnectService(service);
            }
            this.serviceReporterMap.delete(service);
        }))
            .catch(error => {
            if (error instanceof error_1.FatalError)
                throw error;
            this.props.logger.error(`failed to disconnect ${service} service`, error);
        });
    }
    serviceNodePoolUpdated(service) {
        this.props.logger.info(`${service} service node pool has been updated`);
        let reporter = this.serviceReporterMap.get(service);
        if (!reporter && service.broker) {
            reporter = service.broker.createReporter(service);
            this.serviceReporterMap.set(service, reporter);
        }
        if (reporter) {
            reporter.info({
                message: `${service} service node pool has been updated`,
                service: service.getInformation(),
            }, "pool-updated");
        }
    }
    /* schema management */
    validateServiceAPISchema(schema) {
        const errors = interface_1.validateObject(schema, {
            branch: {
                type: "string",
                alphadash: true,
                empty: false,
            },
            protocol: {
                type: "object",
                // do not [strict: true,] for plugin deprecation
                optional: false,
                props: this.plugin.protocol.reduce((props, plugin) => {
                    props[plugin.key] = {
                        type: "custom",
                        optional: true,
                        check(value) {
                            const errs = plugin.validateSchema(value);
                            if (errs.length) {
                                return errs.map(err => {
                                    err.field = `api.protocol.${plugin.key}.${err.field}`;
                                    return err;
                                });
                            }
                            // update meta in case of update from plugin
                            schema.protocol[plugin.key] = value;
                            return true;
                        },
                    };
                    return props;
                }, {}),
            },
            policy: {
                type: "object",
                optional: false,
                props: ["call", "publish", "subscribe"].reduce((props, connectorType) => {
                    props[connectorType] = {
                        type: "array",
                        optional: true,
                        items: {
                            type: "object",
                            // do not [strict: true,] for plugin deprecation
                            props: this.plugin.policy.reduce((policyItemProps, plugin) => {
                                if (policyItemProps[plugin.key]) {
                                    return policyItemProps;
                                }
                                policyItemProps[plugin.key] = {
                                    type: "custom",
                                    optional: true,
                                    check(value) {
                                        const idx = schema.policy[connectorType].findIndex(p => p[plugin.key] === value);
                                        const errs = plugin.validateSchema(value);
                                        if (errs.length) {
                                            return errs.map(err => {
                                                err.field = `api.policy.${connectorType}[${idx}].${plugin.key}${err.field ? `.${err.field}` : ""}`;
                                                return err;
                                            });
                                        }
                                        // update meta in case of update from plugin
                                        schema.policy[plugin.key] = value;
                                        return true;
                                    },
                                };
                                return policyItemProps;
                            }, {
                                description: "string",
                                [connectorType === "call" ? "actions" : "events"]: {
                                    type: "array",
                                    items: "string",
                                    empty: false,
                                },
                            }),
                        },
                    };
                    return props;
                }, {}),
            },
        }, {
            field: "api",
            strict: true,
        });
        // arrange validation errors
        return errors.map((_a) => {
            var { type, message, field, actual, expected, location } = _a, otherProps = tslib_1.__rest(_a, ["type", "message", "field", "actual", "expected", "location"]);
            const err = Object.assign({ type: kleur.bold(kleur.red(type)), message: message ? kleur.yellow(message) : undefined, field: kleur.bold(kleur.cyan(field)), expected,
                actual,
                location }, otherProps);
            if (typeof expected === "undefined") {
                delete err.expected;
            }
            if (typeof actual === "undefined") {
                delete err.actual;
            }
            if (typeof location === "undefined") {
                delete err.location;
            }
            return err;
        });
    }
    hashServiceAPISchema(schema) {
        const obj = lodash_1.default.cloneDeepWith(schema, (value, field) => {
            switch (field) {
                // ignore descriptive fields
                case "description":
                    if (typeof value === "string" && !interface_1.validateInlineFunction(value)) {
                        return null;
                    }
                    return value;
                case "deprecated":
                    if (typeof value === "boolean") {
                        return null;
                    }
                    return value;
                default:
                    return value;
            }
        });
        return interface_1.hashObject(obj, true);
    }
    /* branch management */
    findOrCreateBranch(branchName) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            branchName = branchName.toLowerCase();
            if (!this.branchMap.has(branchName)) {
                let branch;
                // initial branches inherit latest version of master branch
                const parentBranch = this.branchMap.get(branch_1.Branch.Master);
                if (parentBranch) {
                    branch = yield parentBranch.fork({
                        name: branchName,
                        logger: this.props.logger.getChild(branchName),
                    });
                }
                else {
                    // create whole new branch (master branch)
                    branch = new branch_1.Branch({
                        name: branchName,
                        logger: this.props.logger.getChild(branchName),
                        protocolPlugins: this.plugin.protocol,
                    }, this.branchOptions);
                }
                yield branch.start({
                    started: () => {
                        this.props.logger.info(`${branch} branch has been created`);
                        this.emitter.emit(SchemaRegistry.Event.Updated, branch);
                    },
                    updated: () => {
                        this.props.logger.info(`${branch} branch has been updated`);
                        this.emitter.emit(SchemaRegistry.Event.Updated, branch);
                    },
                    removed: () => {
                        this.props.logger.info(`${branch} branch has been removed`);
                        this.emitter.emit(SchemaRegistry.Event.Updated, branch);
                    },
                });
                this.branchMap.set(branchName, branch);
            }
            return this.branchMap.get(branchName);
        });
    }
    getBranch(branchName) {
        return this.branchMap.get(branchName.toLowerCase()) || null;
    }
    getBranches() {
        return Array.from(this.branchMap.values());
    }
    deleteBranch(branchName) {
        return this.$deleteBranch(branchName, true);
    }
    $deleteBranch(branchName, force) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            branchName = branchName.toLowerCase();
            const branch = this.branchMap.get(branchName);
            if (!branch || branch.isMaster || (!branch.isUnused && !force)) {
                return false;
            }
            yield branch.stop();
            this.branchMap.delete(branchName);
            this.props.logger.info(`${branch.name} branch has been ${force ? "manually " : "automatically"} deleted (unused for ${branch.unusedSeconds >= 60 ? `${Math.floor(branch.unusedSeconds / 60)}min` : `${branch.unusedSeconds}sec`})`);
            return true;
        });
    }
    clearUnusedBranches() {
        for (const branch of this.branchMap.values()) {
            this.$deleteBranch(branch.name, false);
        }
    }
}
exports.SchemaRegistry = SchemaRegistry;
SchemaRegistry.Event = {
    Updated: "updated",
    Removed: "removed",
};
//# sourceMappingURL=registry.js.map
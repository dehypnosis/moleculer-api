"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.APIGateway = void 0;
const tslib_1 = require("tslib");
const os = tslib_1.__importStar(require("os"));
const _ = tslib_1.__importStar(require("lodash"));
const error_1 = require("tslint/lib/error");
const broker_1 = require("./broker");
const schema_1 = require("./schema");
const server_1 = require("./server");
const logger_1 = require("./logger");
class APIGateway {
    constructor(opts) {
        this.handleShutdown = ((...args) => {
            this.logger.info(`shutdown signal received: ${args}`);
            return this.stop();
        }).bind(this);
        this.handleUncaughtError = ((reason, ...args) => {
            console.error("uncaught error:", reason, ...args);
            if (reason instanceof error_1.FatalError) { // TODO: normalize error
                return this.stop();
            }
        }).bind(this);
        const _a = opts || {}, { brokers, schema, server, logger } = _a, ownOpts = tslib_1.__rest(_a, ["brokers", "schema", "server", "logger"]);
        // arrange own options
        this.opts = _.defaultsDeep(ownOpts, {
            skipProcessEventRegistration: false,
        });
        // create logger
        const loggerKeys = Object.keys(logger_1.LoggerConstructors);
        let loggerKey = logger && loggerKeys.find(type => !!logger[type]);
        if (!loggerKey) {
            loggerKey = loggerKeys[0];
        }
        const loggerOpts = logger && logger[loggerKey] || {};
        const loggerConstructor = logger_1.LoggerConstructors[loggerKey];
        this.logger = new loggerConstructor({ label: os.hostname() }, loggerOpts);
        // create brokers
        const brokerOptionsList = brokers || [];
        if (brokerOptionsList.length === 0) {
            // default broker option is moleculer
            brokerOptionsList.push({
                moleculer: {},
            });
        }
        this.brokers = brokerOptionsList.map((brokerOpts, index) => {
            return new broker_1.ServiceBroker({
                id: index.toString(),
                logger: this.logger.getChild(`broker[${index}]`),
            }, brokerOpts);
        });
        // create schema registry
        this.schema = new schema_1.SchemaRegistry({
            brokers: this.brokers,
            logger: this.logger.getChild(`schema`),
        }, schema);
        // create server
        this.server = new server_1.APIServer({
            schema: this.schema,
            logger: this.logger.getChild(`server`),
        }, server);
    }
    get delegatedBrokers() {
        return this.brokers.map(b => b.delegatedBroker);
    }
    start() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            // catch os shutdown signal
            if (!this.opts.skipProcessEventRegistration) {
                for (const signal of APIGateway.ShutdownSignals) {
                    process.on(signal, this.handleShutdown);
                }
            }
            // catch error
            process.on("unhandledRejection", this.handleUncaughtError);
            try {
                yield this.server.start();
            }
            catch (error) {
                yield this.handleUncaughtError(error);
            }
        });
    }
    stop() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            if (!this.opts.skipProcessEventRegistration) {
                for (const signal of APIGateway.ShutdownSignals) {
                    process.removeListener(signal, this.handleShutdown);
                }
            }
            process.removeListener("unhandledRejection", this.handleUncaughtError);
            yield this.server.stop();
        });
    }
}
exports.APIGateway = APIGateway;
APIGateway.ShutdownSignals = ["SIGINT", "SIGTERM", "SIGHUP", "beforeExit"];
//# sourceMappingURL=gateway.js.map
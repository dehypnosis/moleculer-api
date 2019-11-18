"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const broker_1 = require("../broker");
const logger_1 = require("../logger");
const schema_1 = require("../schema");
const server_1 = require("../server");
function sleepUntil(predicate, timeoutSeconds = 10, sleepSeconds = 0.5) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        if (predicate())
            return;
        if (timeoutSeconds <= 0)
            return;
        yield sleep(sleepSeconds);
        return sleepUntil(predicate, timeoutSeconds - sleepSeconds);
    });
}
exports.sleepUntil = sleepUntil;
function sleep(seconds) {
    return new Promise(r => setTimeout(r, seconds * 1000));
}
exports.sleep = sleep;
function getLogger(props) {
    const label = props && props.label || "test";
    const level = props && props.level || "error";
    const silent = props && props.silent || false;
    return new logger_1.WinstonLogger({ label }, { level, silent });
}
exports.getLogger = getLogger;
let i = 0;
function getServiceBroker(props) {
    const broker = new broker_1.ServiceBroker({
        id: (i++).toString(),
        logger: getLogger(props && props.logger),
    }, props && props.delegator);
    return broker;
}
exports.getServiceBroker = getServiceBroker;
function getSchemaRegistry(props) {
    return new schema_1.SchemaRegistry({
        logger: getLogger(props && props.logger),
        brokers: [getServiceBroker(props)],
    }, props && props.opts);
}
exports.getSchemaRegistry = getSchemaRegistry;
function getAPIServer(props) {
    return new server_1.APIServer({
        logger: getLogger(props && props.logger),
        schema: props && props.schema || getSchemaRegistry(),
    }, props && props.opts);
}
exports.getAPIServer = getAPIServer;
//# sourceMappingURL=util.js.map
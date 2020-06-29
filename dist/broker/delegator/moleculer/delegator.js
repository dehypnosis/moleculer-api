"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MoleculerServiceBrokerDelegator = void 0;
const tslib_1 = require("tslib");
const Moleculer = tslib_1.__importStar(require("moleculer"));
const interface_1 = require("../../../interface");
const name_1 = require("../../name");
const delegator_1 = require("../delegator");
const discover_1 = require("./discover");
const logger_1 = require("./logger");
const service_1 = require("./service");
class MoleculerServiceBrokerDelegator extends delegator_1.ServiceBrokerDelegator {
    constructor(props, opts) {
        super(props);
        this.props = props;
        /* action/event name matching for call, publish, subscribe, clear cache */
        this.actionNameResolver = name_1.defaultNamePatternResolver;
        this.eventNameResolver = name_1.defaultNamePatternResolver;
        const _a = opts || {}, { services = [], streamingCallTimeout = 1000 * 3600, streamingToStringEncoding = "base64" } = _a, moleculerBrokerOptions = tslib_1.__rest(_a, ["services", "streamingCallTimeout", "streamingToStringEncoding"]);
        this.opts = {
            streamingCallTimeout,
            streamingToStringEncoding,
        };
        const bOpts = moleculerBrokerOptions;
        bOpts.logger = logger_1.createMoleculerLoggerOptions(this.props.logger);
        bOpts.skipProcessEventRegistration = true;
        this.broker = new Moleculer.ServiceBroker(bOpts);
        // create optional moleculer services with this broker
        if (services) {
            for (const serviceSchema of services) {
                this.broker.createService(serviceSchema);
            }
        }
        // create a service which handles event and service discovery
        this.service = this.broker.createService(service_1.createMoleculerServiceSchema(props));
    }
    /* lifecycle */
    start() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield this.service._start();
            yield this.broker.start();
            // emit local node discovery event
            this.broker.getLocalNodeInfo();
            const localServices = discover_1.proxyMoleculerServiceDiscovery(this.broker.registry.nodes.localNode);
            for (const service of localServices) {
                this.props.emitServiceConnected(service);
            }
        });
    }
    stop() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            // emit local node discovery event
            this.broker.getLocalNodeInfo();
            const localServices = discover_1.proxyMoleculerServiceDiscovery(this.broker.registry.nodes.localNode);
            for (const service of localServices) {
                this.props.emitServiceDisconnected(service, this.broker.nodeID);
            }
            yield this.broker.stop();
        });
    }
    /* create context for request */
    createContext(base) {
        const context = Moleculer.Context.create(this.broker);
        context.requestID = base.id || null; // copy request id
        this.props.logger.debug(`${context.requestID} moleculer context created`);
        return context;
    }
    clearContext(context) {
        this.props.logger.debug(`${context.requestID} moleculer context cleared`);
    }
    /* call action */
    selectActionTargetNode(context, action) {
        const epList = this.broker.registry.getActionEndpoints(action.id);
        if (!epList) {
            return null;
        }
        const candidateNodeIdMap = action.service.nodeIdMap;
        const endpoints = epList.endpoints.filter((ep) => ep.isAvailable && candidateNodeIdMap.has(ep.id));
        if (endpoints.length === 0) {
            return null;
        }
        const endpoint = epList.select(endpoints, context);
        if (endpoint) {
            return candidateNodeIdMap.get(endpoint.id) || null;
        }
        return null;
    }
    call(context, args) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const { action, node, params, disableCache } = args;
            if (disableCache) {
                context.meta.$cache = false;
            }
            let response;
            // create child context
            const ctx = Moleculer.Context.create(this.broker);
            // prepare streaming request
            let callParams = params;
            const callOpts = {
                nodeID: node === null || node === void 0 ? void 0 : node.id,
                parentCtx: context,
            };
            if (typeof params === "object" && params !== null) {
                // pipe streaming data only when root object has stream
                if (typeof params.createReadStream === "function") {
                    const { createReadStream } = params, meta = tslib_1.__rest(params, ["createReadStream"]);
                    const stream = params.createReadStream();
                    if (!interface_1.isReadStream(stream)) {
                        throw new Error("invalid stream request"); // TODO: normalize error
                    }
                    callParams = stream;
                    callOpts.meta = meta;
                    callOpts.retries = 0;
                    callOpts.timeout = this.opts.streamingCallTimeout;
                    // read all file streams as buffer for child stream params
                }
                else if (yield this.parseNestedStreamAsBuffer(callParams)) {
                    callOpts.retries = 0;
                    callOpts.timeout = this.opts.streamingCallTimeout;
                }
            }
            // call the action
            response = yield ctx.call(action.id, callParams, callOpts);
            // streaming response (can obtain other props from ctx.meta in streaming response)
            if (interface_1.isReadStream(response)) {
                return Object.assign({ createReadStream: () => response }, ctx.meta);
            }
            else {
                // normal response
                return response;
            }
        });
    }
    parseNestedStreamAsBuffer(v) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            if (Array.isArray(v)) {
                // return either any props had a stream or not.
                return (yield Promise.all(v.map((vv) => this.parseNestedStreamAsBuffer(vv)))).some(p => !!p);
            }
            else if (typeof v === "object" && v !== null) {
                // found a stream object
                if (typeof v.createReadStream === "function") {
                    const stream = v.createReadStream();
                    delete v.createReadStream;
                    if (!interface_1.isReadStream(stream)) {
                        throw new Error("invalid stream request"); // TODO: normalize error
                    }
                    // read stream as buffer string with given encoding
                    yield new Promise((resolve, reject) => {
                        const chunks = [];
                        stream
                            .on("data", chunk => chunks.push(chunk))
                            .on("error", reject)
                            .on("end", () => {
                            try {
                                v.buffer = Buffer.concat(chunks).toString(this.opts.streamingToStringEncoding);
                                v.encoding = this.opts.streamingToStringEncoding;
                                resolve();
                            }
                            catch (err) {
                                reject(err);
                            }
                        });
                    });
                    return true;
                }
                else {
                    // return either any props had a stream or not.
                    return (yield Promise.all(Object.values(v).map(vv => this.parseNestedStreamAsBuffer(vv)))).some(p => !!p);
                }
            }
            return false;
        });
    }
    /* publish event */
    publish(context, args) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const { event, params, groups, broadcast } = args;
            const publish = broadcast ? this.broker.broadcast : this.broker.emit;
            publish(event, params, { groups: groups && groups.length > 0 ? groups : undefined, parentCtx: context });
        });
    }
    /* cache management */
    clearActionCache(action) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            try {
                yield this.broker.cacher.clean(`${action.id}:**`);
                return true;
            }
            catch (_a) {
                return false;
            }
        });
    }
    clearServiceCache(service) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            try {
                yield this.broker.cacher.clean(`${service.id}.**`);
                return true;
            }
            catch (_a) {
                return false;
            }
        });
    }
    clearAllCache() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            try {
                yield this.broker.cacher.clean();
                return true;
            }
            catch (_a) {
                return false;
            }
        });
    }
    /* health check */
    healthCheckCall(action) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const updatedAt = new Date();
            const transit = this.broker.transit;
            const connected = !!(transit && transit.isReady);
            if (!connected) {
                return {
                    message: `service broker is disconnected`,
                    code: 503,
                    updatedAt,
                };
            }
            // action endpoint given
            const candidateNodeIdMap = action.service.nodeIdMap;
            const epList = this.broker.registry.actions.actions.get(action);
            const endpoints = epList ? epList.endpoints.filter((ep) => candidateNodeIdMap.has(ep.id)) : [];
            if (endpoints.length === 0) {
                return {
                    message: "there are no action endpoints",
                    code: 404,
                    updatedAt,
                };
            }
            const unavailableEndpoints = endpoints.filter((ep) => !ep.state || !ep.node.available);
            const available = `${endpoints.length - unavailableEndpoints.length}/${endpoints.length} available`;
            if (unavailableEndpoints.length === endpoints.length) {
                return {
                    message: `there are no available action endpoints: ${available}`,
                    code: 503,
                    updatedAt,
                };
            }
            return {
                message: `there are available action endpoints: ${available}`,
                code: 200,
                updatedAt,
            };
        });
    }
    healthCheckPublish(args) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const { event, groups, broadcast } = args; // ignore params
            const updatedAt = new Date();
            const transit = this.broker.transit;
            const connected = !!(transit && transit.connected);
            if (!connected) {
                return {
                    message: `service broker is disconnected`,
                    code: 503,
                    updatedAt,
                };
            }
            // status of event subscription
            const endpoints = this.broker.registry.events.getAllEndpoints(event, groups);
            if (endpoints.length === 0) {
                return {
                    message: `there are no subscription endpoints for the given event`,
                    code: 404,
                    updatedAt,
                };
            }
            const unavailableEndpoints = endpoints.filter((ep) => !ep.state || !ep.node.available);
            const available = `${endpoints.length - unavailableEndpoints.length}/${endpoints.length} available`;
            if (broadcast) {
                if (unavailableEndpoints.length > 0) {
                    return {
                        message: `there are unavailable subscription endpoints for broadcasting: ${available}`,
                        code: 503,
                        updatedAt,
                    };
                }
                return {
                    message: `all subscription endpoints are available for broadcasting: ${available}`,
                    code: 200,
                    updatedAt,
                };
            }
            if (unavailableEndpoints.length === endpoints.length) {
                return {
                    message: `there are no available subscription endpoints: ${available}`,
                    code: 503,
                    updatedAt,
                };
            }
            return {
                message: `there are available endpoints: ${available}`,
                code: 200,
                updatedAt,
            };
        });
    }
    healthCheckSubscribe() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            // just check transit status
            const transit = this.broker.transit;
            const connected = !!(transit && transit.connected);
            return {
                message: connected ? `event subscription is available` : `service broker is disconnected`,
                code: connected ? 200 : 503,
                updatedAt: new Date(),
            };
        });
    }
    healthCheckService(service) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const updatedAt = new Date();
            const transit = this.broker.transit;
            const connected = !!(transit && transit.connected);
            if (!connected) {
                return {
                    message: `service broker is disconnected`,
                    code: 503,
                    updatedAt,
                };
            }
            // find service
            const services = this.broker.registry.services.services.filter((svc) => service.nodeIdMap.has(svc.node.id) && svc.name === service.id);
            if (services.length === 0) {
                return {
                    message: "cannot find the service",
                    code: 404,
                    updatedAt,
                };
            }
            const unavailableServices = services.filter((svc) => svc.node.available);
            const available = `${services.length - unavailableServices.length}/${services.length} available`;
            const ok = unavailableServices.length === services.length;
            return {
                message: ok ? `there are no available services: ${available}` : `there are available services: ${available}`,
                code: ok ? 200 : 503,
                updatedAt,
            };
        });
    }
    /* send reporter to service */
    report(service, messages, table) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const action = `${service.id}.$report`;
            const params = { messages, table };
            const payloads = Array.from(service.nodeIdMap.keys())
                .map(nodeID => ({ action, params, nodeID }));
            yield this.broker.mcall(payloads, { retries: 3, timeout: 3000 });
        });
    }
}
exports.MoleculerServiceBrokerDelegator = MoleculerServiceBrokerDelegator;
MoleculerServiceBrokerDelegator.key = "moleculer";
//# sourceMappingURL=delegator.js.map
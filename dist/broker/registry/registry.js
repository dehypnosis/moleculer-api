"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ServiceRegistry = void 0;
const tslib_1 = require("tslib");
const _ = tslib_1.__importStar(require("lodash"));
const interface_1 = require("../../interface");
class ServiceRegistry {
    constructor(props, opts) {
        this.props = props;
        this.actionExamplesQueue = [];
        this.eventExamplesQueue = [];
        this.serviceHashMap = new Map();
        this.healthChecking = false;
        this.opts = _.defaultsDeep(opts || {}, {
            examples: {
                processIntervalSeconds: 5,
                queueLimit: 50,
                limitPerActions: 10,
                limitPerEvents: 10,
                streamNotation: "*STREAM*",
                omittedNotation: "*OMITTED*",
                omittedLimit: 100,
                redactedNotation: "*REDACTED*",
                redactedParamNameRegExps: [
                    /password/i,
                    /secret/i,
                    /credential/i,
                    /key/i,
                    /token/i,
                ],
            },
            healthCheck: {
                intervalSeconds: 10,
            },
        });
    }
    addService(service) {
        this.serviceHashMap.set(service.hash, service);
    }
    removeServiceByHash(hash) {
        return this.serviceHashMap.delete(hash);
    }
    findServiceByHash(hash) {
        return this.serviceHashMap.get(hash) || null;
    }
    get services() {
        return Array.from(this.serviceHashMap.values());
    }
    addActionExample(args) {
        if (this.actionExamplesQueue.length > this.opts.examples.queueLimit) {
            return;
        }
        const { params, response } = args;
        this.actionExamplesQueue.push({ serviceHash: args.action.service.hash, actionId: args.action.id, params, response });
    }
    addEventExample(events, packet) {
        if (this.eventExamplesQueue.length > this.opts.examples.queueLimit) {
            return;
        }
        this.eventExamplesQueue.push({ events, packet });
    }
    consumeExamplesQueues() {
        const actionExamples = this.actionExamplesQueue.splice(0);
        const eventExamples = this.eventExamplesQueue.splice(0);
        for (const { serviceHash, actionId, params, response } of actionExamples) {
            const example = { params: this.sanitizeObject(params), response: this.sanitizeObject(response) };
            const service = this.serviceHashMap.get(serviceHash);
            if (service) {
                for (const [id, act] of service.actionMap) {
                    if (id === actionId) {
                        act.addExample(example, this.opts.examples.limitPerActions);
                        return;
                    }
                }
            }
        }
        for (const { events, packet } of eventExamples) {
            const example = Object.assign(Object.assign({}, packet), { params: this.sanitizeObject(packet.params) });
            for (const svc of this.serviceHashMap.values()) {
                for (const evt of svc.subscribedEvents) {
                    if (events.includes(evt.id) && (example.groups == null || example.groups.includes(evt.group))) {
                        evt.addExample(example, this.opts.examples.limitPerEvents);
                    }
                }
            }
        }
    }
    sanitizeObject(obj) {
        const opts = this.opts.examples;
        return interface_1.sanitizeObject(obj, {
            redactedObjectKeyRegExps: opts.redactedParamNameRegExps,
            redactedNotation: opts.redactedNotation,
            omittedLimit: opts.omittedLimit,
            omittedNotation: opts.omittedNotation,
            streamNotation: opts.streamNotation,
        });
    }
    healthCheck() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            if (this.healthChecking) {
                return;
            }
            this.healthChecking = true;
            try {
                yield Promise.all(this.services.map(service => service.healthCheck()));
            }
            catch (error) {
                this.props.logger.error(error);
            }
            finally {
                this.healthChecking = false;
            }
        });
    }
    start() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            this.consumeExamplesIntervalTimer = setInterval(() => this.consumeExamplesQueues(), this.opts.examples.processIntervalSeconds * 1000);
            this.healthCheckIntervalTimer = setInterval(() => this.healthCheck(), this.opts.healthCheck.intervalSeconds * 1000);
            return;
        });
    }
    stop() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            this.actionExamplesQueue.splice(0);
            this.eventExamplesQueue.splice(0);
            this.serviceHashMap.clear();
            if (this.consumeExamplesIntervalTimer) {
                clearInterval(this.consumeExamplesIntervalTimer);
                delete this.consumeExamplesIntervalTimer;
            }
            if (this.healthCheckIntervalTimer) {
                clearInterval(this.healthCheckIntervalTimer);
                delete this.healthCheckIntervalTimer;
            }
            return;
        });
    }
}
exports.ServiceRegistry = ServiceRegistry;
//# sourceMappingURL=registry.js.map
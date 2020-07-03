"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ServiceBroker = void 0;
const tslib_1 = require("tslib");
const kleur = tslib_1.__importStar(require("kleur"));
const _ = tslib_1.__importStar(require("lodash"));
const registry_1 = require("./registry");
const reporter_1 = require("./reporter");
const pubsub_1 = require("./pubsub");
const params_1 = require("./params");
const batching_1 = require("./batching");
const function_1 = require("./function");
const delegator_1 = require("./delegator");
class ServiceBroker {
    constructor(props, opts) {
        this.props = props;
        /* lifecycle */
        this.working = false;
        // save options
        this.opts = _.defaultsDeep(opts || {}, {
            log: {
                event: true,
                call: true,
            },
        });
        // create delegator from options
        const delegatorKeys = Object.keys(delegator_1.ServiceBrokerDelegatorConstructors);
        let delegatorKey = delegatorKeys.find(type => !!this.opts[type]);
        if (!delegatorKey) {
            delegatorKey = delegatorKeys[0];
            this.props.logger.info(`available delegator options are not specified: use ${delegatorKey} delegator`);
        }
        const key = delegatorKey;
        this.delegator = new (delegator_1.ServiceBrokerDelegatorConstructors[key])({
            logger: this.props.logger.getChild(key),
            emitEvent: this.emitEvent.bind(this),
            emitServiceConnected: this.emitServiceConnected.bind(this),
            emitServiceDisconnected: this.emitServiceDisconnected.bind(this),
        }, this.opts[key] || {});
        this.delegatorSymbol = Symbol(`BrokerDelegator:${this.props.id}`);
        // create event buses
        this.eventPubSub = new pubsub_1.EventPubSub({
            onError: error => this.props.logger.error(error),
            eventNamePatternResolver: this.delegator.eventNameResolver,
            maxListeners: Infinity,
        });
        this.discoveryPubSub = new pubsub_1.DiscoveryPubSub({
            onError: error => this.props.logger.error(error),
        });
        // create registry
        this.registry = new registry_1.ServiceRegistry({
            logger: this.props.logger.getChild("registry"),
        }, this.opts.registry);
    }
    get delegatedBroker() {
        return this.delegator.broker;
    }
    start(listeners) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            this.working = true;
            yield this.discoveryPubSub.subscribeAll(listeners);
            yield this.registry.start();
            yield this.delegator.start();
            this.props.logger.info(`service broker has been started: ${kleur.yellow(this.delegator.key)}`);
        });
    }
    stop() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            this.working = false;
            yield this.registry.stop();
            this.discoveryPubSub.unsubscribeAll();
            this.eventPubSub.unsubscribeAll();
            yield this.delegator.stop();
            this.props.logger.info(`service broker has been stopped`);
        });
    }
    /*
      protected methods for brokering discovery and events by delegator
    */
    emitEvent(packet) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            if (!this.working) {
                return;
            }
            // publish and store
            yield this.eventPubSub.publish(packet.event, packet);
            this.registry.addEventExample(this.resolveEventName(packet.event), packet);
            // log
            this.props.logger[this.opts.log.event ? "info" : "debug"](`received ${kleur.green(packet.event)} ${packet.broadcast ? "broadcast " : ""}event from ${kleur.yellow(packet.from || "unknown")}`);
        });
    }
    emitServiceConnected(service) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            if (!this.working) {
                return;
            }
            if (!(service instanceof registry_1.Service) || !service.id) { // unrecognized service
                this.props.logger.error(`service broker discovered a unrecognized service: ${service}`);
                return;
            }
            const foundService = this.registry.findServiceByHash(service.hash);
            if (foundService) { // node pool updated
                for (const node of service.nodeIdMap.values()) {
                    foundService.addNode(node);
                }
                yield this.discoveryPubSub.publish("nodePoolUpdated", service);
            }
            else { // new service connected
                service.setBroker(this);
                this.registry.addService(service);
                yield this.discoveryPubSub.publish("connected", service);
            }
        });
    }
    emitServiceDisconnected(service, nodeId) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            if (!this.working) {
                return;
            }
            const foundService = this.registry.findServiceByHash(service.hash);
            if (!foundService || !foundService.nodeIdMap.delete(nodeId)) { // unknown service
                this.props.logger.error(`service broker has been disconnected from non-registered service node: ${service} (${nodeId})`);
            }
            else if (foundService.nodeIdMap.size === 0) { // service disconnected
                this.registry.removeServiceByHash(foundService.hash);
                yield this.discoveryPubSub.publish("disconnected", foundService);
            }
            else { // node pool updated
                yield this.discoveryPubSub.publish("nodePoolUpdated", foundService);
            }
        });
    }
    /* context resource management */
    getDelegatorContext(context) {
        let delegatorContext = context.get(this.delegatorSymbol);
        if (!delegatorContext) {
            delegatorContext = this.delegator.createContext(context);
            context.set(this.delegatorSymbol, delegatorContext, ctx => this.delegator.clearContext(ctx));
        }
        return delegatorContext;
    }
    getEventSubscriptions(context) {
        let subscriptions = context.get(ServiceBroker.EventSubscriptionSymbol);
        if (!subscriptions) {
            subscriptions = [];
            context.set(ServiceBroker.EventSubscriptionSymbol, subscriptions, subs => {
                for (const sub of subs) {
                    this.unsubscribeEvent(sub);
                }
            });
        }
        return subscriptions;
    }
    getBatchingPool(context) {
        let batchingPool = context.get(ServiceBroker.BatchingPoolSymbol);
        if (!batchingPool) {
            batchingPool = new batching_1.BatchingPool(this.opts.batching);
            context.set(ServiceBroker.BatchingPoolSymbol, batchingPool, pool => {
                pool.clear();
            });
        }
        return batchingPool;
    }
    /* action call */
    call(context, args) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const ctx = this.getDelegatorContext(context);
            const { action, params, batchingParams, disableCache } = args;
            const node = this.delegator.selectActionTargetNode(ctx, action);
            // console.assert(node && action, "there are no available nodes to call the action");
            // do batching
            if (batchingParams) {
                const batchingPool = this.getBatchingPool(context);
                const batchingParamNames = Object.keys(batchingParams);
                const batchingKey = batchingPool.getBatchingKey({ action: action.id, params, batchingParamNames });
                // set batching handler for this call
                if (!batchingPool.hasBatchingHandler(batchingKey)) { // or register job
                    batchingPool.setBatchingHandler(batchingKey, (batchingParamsList) => tslib_1.__awaiter(this, void 0, void 0, function* () {
                        // merge common params with batching params
                        const mergedParams = (params || {});
                        for (const batchingParamName of batchingParamNames) {
                            mergedParams[batchingParamName] = [];
                        }
                        for (const bParams of batchingParamsList) {
                            for (const [k, v] of Object.entries(bParams)) {
                                mergedParams[k].push(v);
                            }
                        }
                        // log in advance
                        this.props.logger[this.opts.log.call ? "info" : "debug"](`call ${action}${kleur.cyan("@")}${node} ${kleur.cyan(batchingParamsList.length)} times in a batch from ${kleur.yellow((context.id || "unknown") + "@" + (context.ip || "unknown"))}`);
                        // do batching call
                        const response = yield this.delegator.call(ctx, { action, node, params: mergedParams, disableCache });
                        this.registry.addActionExample({ action, params: mergedParams, response });
                        return response;
                    }));
                }
                // add batch entry and wait response
                return batchingPool.batch(batchingKey, batchingParams);
            }
            else {
                // log in advance
                this.props.logger[this.opts.log.call ? "info" : "debug"](`call ${action}${kleur.cyan("@")}${node} from ${kleur.yellow((context.id || "unknown") + "@" + (context.ip || "unknown"))}`);
                // normal request
                const response = yield this.delegator.call(ctx, { action, node, params, disableCache });
                this.registry.addActionExample({ action, params, response });
                return response;
            }
        });
    }
    /* action call cache */
    clearActionCache(action) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            if (yield this.delegator.clearActionCache(action)) {
                this.props.logger.info(`${action} action caches have been cleared`);
            }
        });
    }
    clearServiceCache(service) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            if (yield this.delegator.clearServiceCache(service)) {
                this.props.logger.info(`${service} service caches have been cleared`);
            }
        });
    }
    clearAllCache() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            if (yield this.delegator.clearAllCache()) {
                this.props.logger.info(`all caches have been cleared`);
            }
        });
    }
    /* event pub/sub */
    subscribeEvent(context, eventNamePattern, listener) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const subscriptions = this.getEventSubscriptions(context);
            if (listener) {
                subscriptions.push(...(yield this.eventPubSub.subscribe(eventNamePattern, listener)));
                return undefined;
            }
            // returns event packet async iterator when no listener given
            const iterator = this.eventPubSub.asyncIterator(eventNamePattern);
            subscriptions.push(iterator);
            return iterator;
        });
    }
    unsubscribeEvent(subscription) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            if (typeof subscription === "number") {
                this.eventPubSub.unsubscribe(subscription);
            }
            else if (subscription.return) {
                yield subscription.return();
            }
        });
    }
    publishEvent(context, args) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const ctx = this.getDelegatorContext(context);
            yield this.delegator.publish(ctx, args);
            // add from information to original packet and store as example
            const packet = args;
            packet.from = `${context.id || "unknown"}@${context.ip || "unknown"}`;
            this.registry.addEventExample(this.resolveEventName(args.event), packet);
            // log
            this.props.logger[this.opts.log.event ? "info" : "debug"](`published ${kleur.green(packet.event)} ${packet.broadcast ? "broadcast " : ""}event from ${kleur.yellow(packet.from)}`);
        });
    }
    /* params mapper */
    createParamsMapper(opts) {
        return new params_1.ParamsMapper(opts);
    }
    /* compile inline function string */
    createInlineFunction(props) {
        return function_1.createInlineFunction(props, this.opts.function);
    }
    /* service reporter */
    createReporter(service) {
        return new reporter_1.Reporter({
            logger: this.props.logger.getChild(`${service}\n`),
            service,
            props: null,
            send: (messages, table) => this.delegator.report(service, messages, table),
        }, this.opts.reporter);
    }
    /* pattern matching for action and event names */
    matchActionName(name, namePattern) {
        return this.delegator.actionNameResolver(name).includes(namePattern);
    }
    resolveActionName(name) {
        return this.delegator.actionNameResolver(name);
    }
    matchEventName(name, namePattern) {
        return this.delegator.eventNameResolver(name).includes(namePattern);
    }
    resolveEventName(name) {
        return this.delegator.eventNameResolver(name);
    }
    /* health check */
    healthCheckService(service) {
        return this.delegator.healthCheckService(service);
    }
    healthCheckCall(action) {
        return this.delegator.healthCheckCall(action);
    }
    healthCheckPublish(args) {
        return this.delegator.healthCheckPublish(args);
    }
    healthCheckSubscribe() {
        return this.delegator.healthCheckSubscribe();
    }
}
exports.ServiceBroker = ServiceBroker;
ServiceBroker.EventSubscriptionSymbol = Symbol("BrokerEventSubscriptions");
ServiceBroker.BatchingPoolSymbol = Symbol("BrokerBatchingPool");
//# sourceMappingURL=broker.js.map
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const kleur = tslib_1.__importStar(require("kleur"));
const index_1 = require("./index");
class Service {
    constructor(props) {
        this.props = props;
        this.status = { message: "unknown", code: 503, updatedAt: new Date() };
        this.$broker = null;
        this.nodeIdMap = new Map(this.props.nodes.map(n => [n.id, n]));
        this.actionMap = new Map();
        this.shortHash = this.props.hash.substr(0, 8);
        this.subscribedEvents = [];
        // clear nodes props for garbage collection
        this.props.nodes.splice(0);
    }
    get hash() {
        return this.props.hash;
    }
    get id() {
        return this.props.id;
    }
    get displayName() {
        return this.props.displayName;
    }
    get description() {
        return this.props.description;
    }
    get meta() {
        return this.props.meta;
    }
    get broker() {
        return this.$broker || null;
    }
    setBroker(broker) {
        this.$broker = broker;
    }
    toString() {
        return `${kleur.blue(`${this.props.id}:${this.shortHash}`)}${kleur.cyan("@")}${kleur.green(this.nodeIdMap.size > 0 ? Array.from(this.nodeIdMap.keys()).join(",") : "empty-node-pool")}`;
    }
    addNode(node) {
        this.nodeIdMap.set(node.id, new index_1.ServiceNode(node));
    }
    healthCheck() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let status;
            if (!this.broker) {
                status = {
                    message: "service broker is not set",
                    code: 500,
                    updatedAt: new Date(),
                };
            }
            else {
                try {
                    status = yield this.broker.healthCheckService(this);
                }
                catch (error) {
                    status = {
                        message: `failed to health check:\n${error.toString()}`,
                        code: 500,
                        updatedAt: new Date(),
                    };
                }
            }
            Object.assign(this.status, status);
            return status;
        });
    }
    addAction(action) {
        const act = new index_1.ServiceAction(Object.assign(Object.assign({}, action), { service: this }));
        this.actionMap.set(act.id, act);
        return act;
    }
    addSubscribedEvent(event) {
        const evt = new index_1.ServiceEvent(Object.assign(Object.assign({}, event), { service: this }));
        const idx = this.subscribedEvents.findIndex(e => e.id === event.id && e.group === event.group);
        if (idx > -1) {
            this.subscribedEvents.splice(idx, 1, evt);
        }
        else {
            this.subscribedEvents.push(evt);
        }
        return evt;
    }
}
exports.Service = Service;
//# sourceMappingURL=service.js.map
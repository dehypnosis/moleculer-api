"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DiscoveryPubSub = void 0;
const tslib_1 = require("tslib");
const pubsub_1 = require("./pubsub");
class DiscoveryPubSub extends pubsub_1.PubSub {
    constructor(props) {
        super(Object.assign({ maxListeners: 1 }, props));
    }
    subscribeAll(listeners) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield Promise.all([
                this.subscribe("connected", listeners.connected),
                this.subscribe("disconnected", listeners.disconnected),
                this.subscribe("nodePoolUpdated", listeners.nodePoolUpdated),
            ]);
        });
    }
}
exports.DiscoveryPubSub = DiscoveryPubSub;
//# sourceMappingURL=discovery.js.map
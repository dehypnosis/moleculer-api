"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventPubSub = void 0;
const pubsub_1 = require("./pubsub");
class EventPubSub extends pubsub_1.PubSub {
    constructor(props) {
        super(props);
        this.props = props;
    }
}
exports.EventPubSub = EventPubSub;
//# sourceMappingURL=event.js.map
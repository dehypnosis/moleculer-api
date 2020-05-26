"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PubSub = void 0;
const graphql_subscriptions_1 = require("graphql-subscriptions");
class PubSub {
    constructor(props) {
        this.props = props;
        this.delegator = new graphql_subscriptions_1.PubSub();
        this.delegator = new graphql_subscriptions_1.PubSub();
        // @ts-ignore
        this.delegator.ee.setMaxListeners(props.maxListeners);
        // @ts-ignore
        this.delegator.ee.on("error", props.onError);
    }
    asyncIterator(eventNamePattern) {
        const eventNames = this.props.eventNamePatternResolver ? this.props.eventNamePatternResolver(eventNamePattern) : [eventNamePattern];
        return this.delegator.asyncIterator(eventNames);
    }
    subscribe(eventNamePattern, listener) {
        const eventNames = this.props.eventNamePatternResolver ? this.props.eventNamePatternResolver(eventNamePattern) : [eventNamePattern];
        return Promise.all(eventNames.map(eventName => this.delegator.subscribe(eventName, listener)));
    }
    unsubscribe(id) {
        this.delegator.unsubscribe(id);
    }
    unsubscribeAll() {
        // @ts-ignore
        const subscriptionIds = Object.keys(this.delegator.subscriptions);
        for (const subId of subscriptionIds) {
            this.unsubscribe(subId);
        }
    }
    publish(eventName, params) {
        return this.delegator.publish(eventName, params);
    }
}
exports.PubSub = PubSub;
//# sourceMappingURL=pubsub.js.map
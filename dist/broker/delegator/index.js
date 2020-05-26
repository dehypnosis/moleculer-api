"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ServiceBrokerDelegatorConstructors = exports.ServiceBrokerDelegator = void 0;
const delegator_1 = require("./delegator");
Object.defineProperty(exports, "ServiceBrokerDelegator", { enumerable: true, get: function () { return delegator_1.ServiceBrokerDelegator; } });
const moleculer_1 = require("./moleculer");
exports.ServiceBrokerDelegatorConstructors = {
    [moleculer_1.MoleculerServiceBrokerDelegator.key]: moleculer_1.MoleculerServiceBrokerDelegator,
};
//# sourceMappingURL=index.js.map
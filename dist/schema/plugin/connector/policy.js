"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.testSubscribePolicy = exports.testPublishPolicy = exports.testCallPolicy = void 0;
function testCallPolicy(policyPlugins, policies, args) {
    for (const policy of policies) {
        for (const plugin of policyPlugins) {
            const pluginSchema = policy[plugin.key];
            if (!pluginSchema) {
                continue;
            }
            const result = plugin.testCallPolicy(pluginSchema, args);
            if (result === false || result !== true) {
                return result;
            }
        }
    }
    return true;
}
exports.testCallPolicy = testCallPolicy;
function testPublishPolicy(policyPlugins, policies, args) {
    for (const policy of policies) {
        for (const plugin of policyPlugins) {
            const pluginSchema = policy[plugin.key];
            if (!pluginSchema) {
                continue;
            }
            const result = plugin.testPublishPolicy(pluginSchema, args);
            if (result === false || result !== true) {
                return result;
            }
        }
    }
    return true;
}
exports.testPublishPolicy = testPublishPolicy;
function testSubscribePolicy(policyPlugins, policies, args) {
    for (const policy of policies) {
        for (const plugin of policyPlugins) {
            const pluginSchema = policy[plugin.key];
            if (!pluginSchema) {
                continue;
            }
            const result = plugin.testSubscribePolicy(pluginSchema, args);
            if (result === false || result !== true) {
                return result;
            }
        }
    }
    return true;
}
exports.testSubscribePolicy = testSubscribePolicy;
//# sourceMappingURL=policy.js.map
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PolicyCompiler = void 0;
exports.PolicyCompiler = {
    call(policySchemata, policyPlugins, integration, opts) {
        const testers = policyPlugins
            .map(plugin => {
            const matchedList = policySchemata.filter(s => typeof s[plugin.key] !== "undefined").map(s => [s[plugin.key], s.description || null]);
            if (!matchedList.length) {
                return null;
            }
            const schemata = matchedList.map(m => m[0]);
            const descriptions = matchedList.map(m => m[1]);
            return plugin.compileCallPolicySchemata(schemata, descriptions, integration);
        })
            .filter(fn => !!fn);
        return (args) => testers.every(tester => tester(args));
    },
    publish(policySchemata, policyPlugins, integration, opts) {
        const testers = policyPlugins
            .map(plugin => {
            const matchedList = policySchemata.filter(s => typeof s[plugin.key] !== "undefined").map(s => [s[plugin.key], s.description || null]);
            if (!matchedList.length) {
                return null;
            }
            const schemata = matchedList.map(m => m[0]);
            const descriptions = matchedList.map(m => m[1]);
            return plugin.compilePublishPolicySchemata(schemata, descriptions, integration);
        })
            .filter(fn => !!fn);
        return (args) => testers.every(tester => tester(args));
    },
    subscribe(policySchemata, policyPlugins, integration, opts) {
        const testers = policyPlugins
            .map(plugin => {
            const matchedList = policySchemata.filter(s => typeof s[plugin.key] !== "undefined").map(s => [s[plugin.key], s.description || null]);
            if (!matchedList.length) {
                return null;
            }
            const schemata = matchedList.map(m => m[0]);
            const descriptions = matchedList.map(m => m[1]);
            return plugin.compileSubscribePolicySchemata(schemata, descriptions, integration);
        })
            .filter(fn => !!fn);
        return (args) => testers.every(tester => tester(args));
    },
};
//# sourceMappingURL=policy.js.map
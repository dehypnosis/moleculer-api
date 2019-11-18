"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const filter_1 = require("./filter");
const scope_1 = require("./scope");
tslib_1.__exportStar(require("./plugin"), exports);
tslib_1.__exportStar(require("./filter"), exports);
tslib_1.__exportStar(require("./scope"), exports);
exports.PolicyPluginConstructors = {
    [filter_1.FilterPolicyPlugin.key]: filter_1.FilterPolicyPlugin,
    [scope_1.ScopePolicyPlugin.key]: scope_1.ScopePolicyPlugin,
};
exports.defaultPolicyPluginConstructorOptions = {
    [filter_1.FilterPolicyPlugin.key]: filter_1.FilterPolicyPlugin.autoLoadOptions,
    [scope_1.ScopePolicyPlugin.key]: scope_1.ScopePolicyPlugin.autoLoadOptions,
};
//# sourceMappingURL=index.js.map
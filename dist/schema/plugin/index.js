"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const policy_1 = require("./policy");
const protocol_1 = require("./protocol");
tslib_1.__exportStar(require("./protocol"), exports);
tslib_1.__exportStar(require("./policy"), exports);
/* plugins */
exports.SchemaPluginConstructors = {
    protocol: protocol_1.ProtocolPluginConstructors,
    policy: policy_1.PolicyPluginConstructors,
};
exports.defaultSchemaPluginConstructorOptions = {
    protocol: protocol_1.defaultProtocolPluginConstructorOptions,
    policy: policy_1.defaultPolicyPluginConstructorOptions,
};
//# sourceMappingURL=index.js.map
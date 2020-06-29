"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScopePolicyPlugin = void 0;
const tslib_1 = require("tslib");
const _ = tslib_1.__importStar(require("lodash"));
const interface_1 = require("../../../../interface");
const plugin_1 = require("../plugin");
class ScopePolicyPlugin extends plugin_1.PolicyPlugin {
    constructor(props, opts) {
        super(props);
        this.props = props;
        this.opts = _.defaultsDeep(opts || {}, {
        // default options
        });
    }
    validateSchema(schema) {
        return interface_1.validateValue(schema, {
            type: "array",
            items: "string",
            empty: false,
        }, {
            field: "",
        });
    }
    start() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            throw new Error("not implemented");
        });
    }
    stop() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            throw new Error("not implemented");
        });
    }
    describeSchema(schema) {
        return {};
    }
    // TODO: OIDC Scope plugin
    testCallPolicy(schema, args) {
        return true;
    }
    testPublishPolicy(schema, args) {
        return true;
    }
    testSubscribePolicy(schema, args) {
        return true;
    }
}
exports.ScopePolicyPlugin = ScopePolicyPlugin;
ScopePolicyPlugin.key = "scope";
ScopePolicyPlugin.autoLoadOptions = false; // plugin is disabled in default
//# sourceMappingURL=plugin.js.map
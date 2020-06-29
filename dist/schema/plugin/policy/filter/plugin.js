"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FilterPolicyPlugin = void 0;
const tslib_1 = require("tslib");
const _ = tslib_1.__importStar(require("lodash"));
const interface_1 = require("../../../../interface");
const plugin_1 = require("../plugin");
class FilterPolicyPlugin extends plugin_1.PolicyPlugin {
    constructor(props, opts) {
        super(props);
        this.props = props;
        this.opts = _.defaultsDeep(opts || {}, FilterPolicyPlugin.autoLoadOptions);
    }
    validateSchema(schema) {
        const errors = [];
        if (!interface_1.validateInlineFunction(schema)) {
            errors.push({
                type: "invalidFunctionString",
                field: "",
                expected: "JavaScriptFunctionString",
                actual: schema,
                message: "FilterPolicyPluginSchema should be a string which denotes a JavaScript function",
            });
        }
        return errors;
    }
    start() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
        });
    }
    stop() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
        });
    }
    // tslint:disable-next-line:ban-types
    describeSchema(schema) {
        return {};
    }
    // TODO: filter policy plugin
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
exports.FilterPolicyPlugin = FilterPolicyPlugin;
FilterPolicyPlugin.key = "filter";
FilterPolicyPlugin.autoLoadOptions = {};
//# sourceMappingURL=plugin.js.map
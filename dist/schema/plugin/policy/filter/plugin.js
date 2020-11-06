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
    compileCallPolicySchemata(schemata, descriptions, integration) {
        return this.compilePolicySchemata(schemata, descriptions, integration);
    }
    compilePublishPolicySchemata(schemata, descriptions, integration) {
        return this.compilePolicySchemata(schemata, descriptions, integration);
    }
    compileSubscribePolicySchemata(schemata, descriptions, integration) {
        return this.compilePolicySchemata(schemata, descriptions, integration);
    }
    compilePolicySchemata(schemata, descriptions, integration) {
        const fnStrings = Array.from(new Set(schemata));
        const descriptionsMap = new Map();
        const testers = fnStrings.map(fnString => {
            const fn = integration.service.broker.createInlineFunction({
                function: fnString,
                mappableKeys: ["context", "params"],
                reporter: integration.reporter,
                returnTypeCheck: v => typeof v === "boolean",
                returnTypeNotation: "boolean",
            });
            if (!descriptionsMap.has(fn)) {
                descriptionsMap.set(fn, []);
            }
            const desc = descriptions[schemata.indexOf(fnString)];
            if (desc) {
                const matchedDescriptions = descriptionsMap.get(fn);
                matchedDescriptions.push(desc);
            }
            return fn;
        });
        return (args) => {
            for (const tester of testers) {
                let authorized = false;
                let originalError = null;
                try {
                    authorized = tester(args);
                }
                catch (err) {
                    originalError = err;
                }
                if (!authorized) {
                    // TODO: normalize error
                    const error = new Error("permission denied");
                    error.statusCode = 401;
                    error.description = descriptionsMap.get(tester);
                    if (this.opts.showOriginalError) {
                        error.originalError = originalError ? originalError.message : null;
                    }
                    throw error;
                }
            }
            return true;
        };
    }
}
exports.FilterPolicyPlugin = FilterPolicyPlugin;
FilterPolicyPlugin.key = "filter";
FilterPolicyPlugin.autoLoadOptions = {
    showOriginalError: true,
};
//# sourceMappingURL=plugin.js.map
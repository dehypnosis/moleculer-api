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
        this.opts = _.defaultsDeep(opts || {}, ScopePolicyPlugin.autoLoadOptions);
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
        });
    }
    stop() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
        });
    }
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
    compilePolicySchemata(requiredScopesList, descriptions, integration) {
        const requiredScopes = [];
        for (const requiredScopesEntry of requiredScopesList) {
            for (const scope of requiredScopesEntry) {
                if (!requiredScopes.includes(scope)) {
                    requiredScopes.push(scope);
                }
            }
        }
        const descriptionsMap = requiredScopes.reduce((map, scope) => {
            const matchedDescriptions = requiredScopesList.reduce((arr, requiredScopesEntry, index) => {
                const desc = descriptions[index];
                if (desc && requiredScopesEntry.includes(scope)) {
                    if (!arr.includes(desc)) {
                        arr.push(desc);
                    }
                }
                return arr;
            }, []);
            map[scope] = matchedDescriptions;
            return map;
        }, {});
        return (args) => {
            const contextScopes = this.opts.getScopesFromContext(args.context);
            for (const requiredScope of requiredScopes) {
                if (!contextScopes.includes(requiredScope)) {
                    // TODO: normalize error
                    const error = new Error("permission denied");
                    error.statusCode = 401;
                    error.expected = requiredScopes;
                    error.actual = contextScopes;
                    error.description = descriptionsMap[requiredScope];
                    throw error;
                }
            }
            return true;
        };
    }
}
exports.ScopePolicyPlugin = ScopePolicyPlugin;
ScopePolicyPlugin.key = "scope";
ScopePolicyPlugin.autoLoadOptions = {
    getScopesFromContext: (ctx) => {
        var _a;
        return Array.isArray((_a = ctx === null || ctx === void 0 ? void 0 : ctx.auth) === null || _a === void 0 ? void 0 : _a.scope) ? ctx.auth.scope : [];
    },
};
//# sourceMappingURL=plugin.js.map
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateInlineFunction = exports.validateValue = exports.compileValidationRule = exports.validateObject = exports.compileValidationSchema = exports.normalizeValidationSchema = void 0;
const tslib_1 = require("tslib");
/*
  extends validation type definition and normalize validation schema for catalog document
  ref: https://github.com/icebob/fastest-validator
 */
const _ = tslib_1.__importStar(require("lodash"));
const fastest_validator_1 = tslib_1.__importDefault(require("fastest-validator"));
const vm = tslib_1.__importStar(require("vm"));
/*
  oneOf.items: Array<NormalizedValidationSchema>
  object.props NormalizedValidationSchema
  array.items: NormalizedValidationSchema[string]
*/
function normalizeValidationSchema(schema) {
    const normalizedSchema = {};
    for (const [paramName, paramSchema] of Object.entries(schema)) {
        normalizedSchema[paramName] = recNormalizeValidationSchema(paramSchema);
    }
    return normalizedSchema;
}
exports.normalizeValidationSchema = normalizeValidationSchema;
function recNormalizeValidationSchema(paramSchema) {
    let schema;
    if (typeof paramSchema === "string") {
        // normalize sugar syntax
        // like "string", "number|optional|integer|positive|min:0|max:99", ...
        // ref: https://github.com/icebob/fastest-validator/releases/tag/v1.0.0-beta1
        schema = {
            type: paramSchema,
            deprecated: false,
            description: null,
        };
        const tokens = paramSchema.split("|").filter(t => t);
        if (tokens.length > 1) {
            for (let i = 1; i < tokens.length; i++) {
                const token = tokens[i];
                const subTokens = token.split(":").filter(t => t);
                if (subTokens.length === 1) {
                    schema[token] = true;
                }
                else if (subTokens.length === 2) {
                    const asNum = parseInt(subTokens[1], 10);
                    schema[token] = isNaN(asNum) ? subTokens[1] : asNum;
                }
            }
        }
    }
    else if (Array.isArray(paramSchema)) {
        // normalize array syntax
        schema = {
            type: "oneOf",
            deprecated: false,
            description: null,
            optional: false,
            items: paramSchema.map(s => recNormalizeValidationSchema(s)),
        };
    }
    else if (paramSchema && typeof paramSchema === "object") {
        // normalize recursive rules
        schema = _.cloneDeep(paramSchema);
        if (schema.type === "object") {
            if (schema.props) {
                schema.props = normalizeValidationSchema(schema.props);
            }
        }
        else if (schema.type === "array") {
            if (schema.items) {
                schema.items = recNormalizeValidationSchema(schema.items);
            }
        }
    }
    else {
        // normalize unknown syntax
        schema = {
            type: "any",
            description: null,
            deprecated: false,
            schema: paramSchema,
        };
    }
    // normalize optional props
    if (!schema.description)
        schema.description = null;
    schema.deprecated = !!schema.deprecated;
    schema.optional = !!schema.optional;
    return schema;
}
function compileValidationSchema(schema, opts) {
    const options = _.defaultsDeep(opts || {}, { strict: true, field: "", messages: {} });
    // apply messages option
    const validator = new fastest_validator_1.default({ messages: options.messages });
    // prepare field (prefix) option
    const prefix = options.field.trim();
    if (prefix) {
        const prefixedSchema = {};
        for (const [k, v] of Object.entries(schema)) {
            prefixedSchema[`${prefix}.${k}`] = v;
        }
        schema = prefixedSchema;
    }
    // apply strict option
    schema.$$strict = !options.strict;
    // create checker
    const check = validator.compile(schema);
    if (prefix) {
        return (value) => {
            let prefixedValue = value;
            if (typeof value === "object" && value !== null) {
                prefixedValue = {};
                for (const [k, v] of Object.entries(value)) {
                    prefixedValue[`${prefix}.${k}`] = v;
                }
            }
            return check(prefixedValue);
        };
    }
    return check;
}
exports.compileValidationSchema = compileValidationSchema;
function validateObject(obj, schema, opts) {
    const result = compileValidationSchema(schema, opts)(obj);
    return result === true ? [] : result;
}
exports.validateObject = validateObject;
function compileValidationRule(rule, opts) {
    const options = _.defaultsDeep(opts || {}, { strict: true, field: "value", messages: {} });
    // apply messages option
    const validator = new fastest_validator_1.default({ messages: options.messages });
    // apply field option
    const schema = { [options.field]: rule };
    // apply strict option
    schema.$$strict = !options.strict;
    // create checker
    const check = validator.compile(schema);
    return (value) => check({ [options.field]: value });
}
exports.compileValidationRule = compileValidationRule;
function validateValue(value, rule, opts) {
    const result = compileValidationRule(rule, opts)(value);
    return result === true ? [] : result;
}
exports.validateValue = validateValue;
function validateInlineFunction(fnString) {
    try {
        return vm.runInNewContext(`typeof (${fnString}) === "function"`, {}, {
            displayErrors: true,
            timeout: 100,
        });
    }
    catch (_a) {
        return false;
    }
}
exports.validateInlineFunction = validateInlineFunction;
//# sourceMappingURL=validation.js.map
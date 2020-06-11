/*
  extends validation type definition and normalize validation schema for catalog document
  ref: https://github.com/icebob/fastest-validator
 */
import * as _ from "lodash";
import Validator, { ValidationSchema, ValidationRuleObject, ValidationRule, RuleObject, RuleArray, RuleCustom, RuleOneOf, ValidationError, MessagesType } from "fastest-validator";
import * as vm from "vm";
import { RecursivePartial } from "./index";

// add oneOf rule and additional props to normalize schema
declare module "fastest-validator" {
  // tslint:disable-next-line:interface-name
  export interface RuleCustom {
    deprecated?: boolean;
    description?: string | null;
  }

  export interface RuleOneOf extends RuleCustom {
    type: "oneOf";
    items: ValidationRuleObject[];
  }
  export type ValidationRuleName = ValidationRuleName | "oneOf";
  export type ValidationRuleObject = ValidationRuleObject | RuleOneOf;
  export interface ValidationError {
    location?: any;
  }
}

// normalize schema for service/API catalog
export type NormalizedValidationSchema = {
  [paramName: string]: ValidationRuleObject;
};

/*
  oneOf.items: Array<NormalizedValidationSchema>
  object.props NormalizedValidationSchema
  array.items: NormalizedValidationSchema[string]
*/
export function normalizeValidationSchema(schema: ValidationSchema): NormalizedValidationSchema {
  const normalizedSchema: NormalizedValidationSchema = {};
  for (const [paramName, paramSchema] of Object.entries(schema)) {
    normalizedSchema[paramName] = recNormalizeValidationSchema(paramSchema);
  }
  return normalizedSchema;
}

function recNormalizeValidationSchema(paramSchema: ValidationSchema[string]): NormalizedValidationSchema[string] {
  let schema: NormalizedValidationSchema[string];
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
      for (let i=1; i<tokens.length; i++) {
        const token = tokens[i];
        const subTokens = token.split(":").filter(t => t);
        if (subTokens.length === 1) {
          schema[token] = true;
        } else if (subTokens.length === 2) {
          const asNum = parseInt(subTokens[1], 10);
          schema[token] = isNaN(asNum) ? subTokens[1] : asNum;
        }
      }
    }
  } else if (Array.isArray(paramSchema)) {
    // normalize array syntax
    const items = paramSchema.map(s => recNormalizeValidationSchema(s));
    schema = {
      type: "oneOf",
      deprecated: false,
      description: null,
      optional: items.every(item => item.optional),
      items: paramSchema.map(s => recNormalizeValidationSchema(s)),
    };
  } else if (paramSchema && typeof paramSchema === "object") {
    // normalize recursive rules
    schema = _.cloneDeep(paramSchema);
    if (schema.type === "object") {
      if (schema.props) {
        schema.props = normalizeValidationSchema((schema as RuleObject).props!);
      }
    } else if (schema.type === "array") {
      if (schema.items) {
        schema.items = recNormalizeValidationSchema((schema as RuleArray).items);
      }
    }
  } else {
    // normalize unknown syntax
    schema = {
      type: "any",
      description: null,
      deprecated: false,
      schema: paramSchema,
    };
  }

  // normalize optional props
  if (!schema.description) schema.description = null;
  schema.deprecated = !!schema.deprecated;
  schema.optional = !!schema.optional || typeof schema.default !== "undefined";
  return schema;
}

export type ValidationFn = (object: object) => true | ValidationError[];
export type ValidateOptions = { strict: boolean, field: string, messages: MessagesType  };

export function compileValidationSchema(schema: ValidationSchema, opts?: RecursivePartial<ValidateOptions>): ValidationFn {
  const options: ValidateOptions = _.defaultsDeep(opts || {}, { strict: true, field: "", messages: {} });

  // apply messages option
  const validator = new Validator({ messages: options.messages! });

  // prepare field (prefix) option
  const prefix = options.field!.trim();
  if (prefix) {
    const prefixedSchema: ValidationSchema = {};
    for (const [k, v] of Object.entries(schema)) {
      prefixedSchema[`${prefix}.${k}`] = v;
    }
    schema = prefixedSchema;
  }

  // apply strict option
  schema.$$strict = !options.strict as any;

  // create checker
  const check = validator.compile(schema);
  if (prefix) {
    return (value) => {
      let prefixedValue: any = value;
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

export function validateObject(obj: any, schema: ValidationSchema, opts?: RecursivePartial<ValidateOptions>): ValidationError[] {
  const result = compileValidationSchema(schema, opts)(obj);
  return result === true ? [] : result;
}

export function compileValidationRule(rule: ValidationRule | ValidationRule[], opts?: RecursivePartial<ValidateOptions>): ValidationFn {
  const options: ValidateOptions = _.defaultsDeep(opts || {}, { strict: true, field: "value", messages: {} });

  // apply messages option
  const validator = new Validator({ messages: options.messages });

  // apply field option
  const schema = { [options.field]: rule } as ValidationSchema;

  // apply strict option
  schema.$$strict = !options.strict as any;

  // create checker
  const check = validator.compile(schema);
  return (value) => check({ [options.field]: value });
}

export function validateValue(value: any, rule: ValidationRule | ValidationRule[], opts?: RecursivePartial<ValidateOptions>): ValidationError[] {
  const result = compileValidationRule(rule, opts)(value);
  return result === true ? [] : result;
}

export function validateInlineFunction(fnString: string): boolean {
  try {
    return vm.runInNewContext(`typeof (${fnString}) === "function"`, {}, {
      displayErrors: true,
      timeout: 100,
    });
  } catch {
    return false;
  }
}

/*
// transform back OneOf rules to []
// const originalSchema = denormalizeValidationSchema(schema);

function denormalizeValidationSchema(schema: NormalizedValidationSchema): ValidationSchema {
  const originalSchema: ValidationSchema = {};
  for (const [paramName, paramSchema] of Object.entries(schema)) {
    originalSchema[paramName] = recDenormalizeValidationSchema(paramSchema);
  }
  return originalSchema;
}

function recDenormalizeValidationSchema(paramSchema: NormalizedValidationSchema[string]): ValidationSchema[string] {
  if (paramSchema.type === "oneOf") return paramSchema.items.map((item: ValidationRuleObject) => recNormalizeValidationSchema(item));
  return paramSchema;
}
*/

export {
  ValidationSchema,
  ValidationRule,
  ValidationRuleName,
  ValidationRuleObject,
  ValidationError,
  RuleAny,
  RuleArray,
  RuleBoolean,
  RuleCustom,
  RuleCustomInline,
  RuleDate,
  RuleEmail,
  RuleEnum,
  RuleForbidden,
  RuleFunction,
  RuleNumber,
  RuleObject,
  RuleString,
  RuleURL,
  RuleUUID,
  RuleOneOf,
  MessagesType,
} from "fastest-validator";

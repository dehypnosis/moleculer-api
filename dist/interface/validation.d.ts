import { ValidationSchema, ValidationRuleObject, ValidationRule, ValidationError, MessagesType } from "fastest-validator";
import { RecursivePartial } from "./index";
declare module "fastest-validator" {
    interface RuleCustom {
        deprecated?: boolean;
        description?: string | null;
    }
    interface RuleOneOf extends RuleCustom {
        type: "oneOf";
        items: ValidationRuleObject[];
    }
    type ValidationRuleName = ValidationRuleName | "oneOf";
    type ValidationRuleObject = ValidationRuleObject | RuleOneOf;
    interface ValidationError {
        location?: any;
    }
}
export declare type NormalizedValidationSchema = {
    [paramName: string]: ValidationRuleObject;
};
export declare function normalizeValidationSchema(schema: ValidationSchema): NormalizedValidationSchema;
export declare type ValidationFn = (object: object) => true | ValidationError[];
export declare type ValidateOptions = {
    strict: boolean;
    field: string;
    messages: MessagesType;
};
export declare function compileValidationSchema(schema: ValidationSchema, opts?: RecursivePartial<ValidateOptions>): ValidationFn;
export declare function validateObject(obj: any, schema: ValidationSchema, opts?: RecursivePartial<ValidateOptions>): ValidationError[];
export declare function compileValidationRule(rule: ValidationRule | ValidationRule[], opts?: RecursivePartial<ValidateOptions>): ValidationFn;
export declare function validateValue(value: any, rule: ValidationRule | ValidationRule[], opts?: RecursivePartial<ValidateOptions>): ValidationError[];
export declare function validateInlineFunction(fnString: string): boolean;
export { ValidationSchema, ValidationRule, ValidationRuleName, ValidationRuleObject, ValidationError, RuleAny, RuleArray, RuleBoolean, RuleCustom, RuleCustomInline, RuleDate, RuleEmail, RuleEnum, RuleForbidden, RuleFunction, RuleNumber, RuleObject, RuleString, RuleURL, RuleUUID, RuleOneOf, MessagesType, } from "fastest-validator";

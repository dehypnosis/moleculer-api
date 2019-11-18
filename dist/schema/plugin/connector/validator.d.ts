import { ValidationRule } from "../../../interface";
export declare const ConnectorValidator: {
    [connector in "call" | "params" | "publish" | "subscribe" | "map"]: ValidationRule;
};

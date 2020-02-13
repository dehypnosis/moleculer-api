import { RecursivePartial } from "../interface";
import { Reporter } from "./reporter";
export declare type InlineFunctionProps<Args, Return> = {
    function: string;
    mappableKeys: Extract<keyof Args, string>[];
    reporter: Reporter;
    returnTypeCheck?: (value: Return) => boolean;
    returnTypeNotation?: string;
};
export declare type InlineFunctionOptions = {
    util: {
        [key: string]: any;
    };
};
export declare function createInlineFunction<Args extends {
    [key: string]: any;
}, Return = any>(props: InlineFunctionProps<Args, Return>, opts?: RecursivePartial<InlineFunctionOptions>): (args: Args) => Return;

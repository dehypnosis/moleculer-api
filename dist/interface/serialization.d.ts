import { RecursivePartial } from "./ts";
declare type SanitizeObjectOptions = {
    streamNotation: string;
    omittedLimit: number;
    omittedNotation: string;
    redactedObjectKeyRegExps: RegExp[];
    redactedNotation: string;
};
export declare function sanitizeObject(obj: any, opts?: RecursivePartial<SanitizeObjectOptions>): any;
export declare function removeANSIColor(message: any): any;
export {};

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const _ = tslib_1.__importStar(require("lodash"));
// @ts-ignore
const smart_circular_1 = tslib_1.__importDefault(require("smart-circular"));
const stream_1 = require("./stream");
function sanitizeObject(obj, opts) {
    const options = _.defaultsDeep(opts || {}, {
        streamNotation: "*STREAM*",
        omittedNotation: "*OMITTED*",
        omittedLimit: 100,
        redactedNotation: "*REDACTED*",
        redactedObjectKeyRegExps: [
            /password/i,
            /secret/i,
            /credential/i,
            /key/i,
            /token/i,
        ],
    });
    return recSanitizeObject(smart_circular_1.default(_.cloneDeep(obj)), options);
}
exports.sanitizeObject = sanitizeObject;
function recSanitizeObject(obj, opts) {
    // function
    if (typeof obj === "function")
        return undefined;
    // stream
    if (stream_1.isStream(obj))
        return opts.streamNotation;
    if (obj !== null && typeof obj === "object") {
        // array
        if (Array.isArray(obj)) {
            return obj.map((item) => recSanitizeObject(item, opts));
        }
        // object
        const o = {};
        // tslint:disable-next-line:forin
        OUTER: for (const k in obj) {
            if (typeof obj[k] === "string") {
                for (const regexp of opts.redactedObjectKeyRegExps) {
                    if (regexp.test(k)) {
                        o[k] = opts.redactedNotation;
                        continue OUTER;
                    }
                }
            }
            o[k] = recSanitizeObject(obj[k], opts);
        }
        return o;
    }
    // string
    if (typeof obj === "string" && obj.length > opts.omittedLimit) {
        return obj.substr(opts.omittedLimit) + " ... " + opts.omittedNotation;
    }
    // others
    return obj;
}
/*
* remove ANSI color characters from object or string
*/
const ANSIColorRegEXP = /[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g;
function removeANSIColor(message) {
    if (typeof message === "string") {
        return message.replace(ANSIColorRegEXP, "");
    }
    else if (typeof message === "object" && message !== null) {
        if (Array.isArray(message)) {
            return message.map(value => removeANSIColor(value));
        }
        else {
            const obj = {};
            for (const [key, value] of Object.entries(message)) {
                obj[key] = removeANSIColor(value);
            }
            return obj;
        }
    }
    return message;
}
exports.removeANSIColor = removeANSIColor;
//# sourceMappingURL=serialization.js.map
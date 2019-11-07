import * as _ from "lodash";
// @ts-ignore
import removeCircular from "smart-circular";
import { RecursivePartial } from "./index";
import { isStream } from "./stream";

type SanitizeObjectOptions = {
  streamNotation: string,
  omittedLimit: number,
  omittedNotation: string,
  redactedObjectKeyRegExps: RegExp[],
  redactedNotation: string,
};

export function sanitizeObject(obj: any, opts?: RecursivePartial<SanitizeObjectOptions>): any {
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
  return recSanitizeObject(removeCircular(_.cloneDeep(obj)), options);
}

function recSanitizeObject(obj: any, opts: SanitizeObjectOptions): any {
  // function
  if (typeof obj === "function") return undefined;

  // stream
  if (isStream(obj)) return opts.streamNotation;

  if (obj !== null && typeof obj === "object") {
    // array
    if (Array.isArray(obj)) {
      return obj.map((item: any) => recSanitizeObject(item, opts));
    }

    // object
    const o: any = {};
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
  if (typeof obj === "string" && obj.length > opts.omittedLimit!) {
    return obj.substr(opts.omittedLimit!) + " ... " + opts.omittedNotation!;
  }

  // others
  return obj;
}

/*
* remove ANSI color characters from object or string
*/

const ANSIColorRegEXP = /[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g;
export function removeANSIColor(message: any): any {
  if (typeof message === "string") {
    return message.replace(ANSIColorRegEXP, "");
  } else if (typeof message === "object" && message !== null) {
    if (Array.isArray(message)) {
      return message.map(value => removeANSIColor(value));
    } else {
      const obj: any = {};
      for (const [key,value] of Object.entries(message)) {
        obj[key] = removeANSIColor(value);
      }
      return obj;
    }
  }

  return message;
}

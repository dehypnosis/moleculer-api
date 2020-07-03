import * as kleur from "kleur";
import * as _ from "lodash";
import * as os from "os";
import { table, getBorderCharacters } from "table";
import { hashObject, removeANSIColor } from "../interface";
import { Service } from "./registry";
import { Logger } from "../logger";

export type Report = {
  type: "info" | "warn" | "debug" | "error";
  message: any;
  at: Date;
  key?: string;
};

export type ReporterProps = {
  logger: Logger;
  service: Readonly<Service>;
  props: { [key: string]: any } | null;

  /* delegated method to send messages to origin service */
  send(messages: Report[], table: string): Promise<void>;
};

export type ReporterOptions = {
  tableWidthZoomFactor: number;
};

export class Reporter {
  private readonly gatewayNodeId = os.hostname();

  constructor(private readonly props: ReporterProps, private readonly opts?: Partial<ReporterOptions>) {
    this.opts = _.defaultsDeep(this.opts || {}, {
      tableWidthZoomFactor: 1,
    });
    // adjust report table column size: 0.5 ~ 2, default: 1
    if (!isNaN(this.opts!.tableWidthZoomFactor!)) {
      this.opts!.tableWidthZoomFactor = Math.min(2, Math.max(this.opts!.tableWidthZoomFactor!, 0.5));
    }
  }

  public getChild(props: { [key: string]: any } | null): Reporter {
    return new Reporter({
      ...this.props,
      props: props === null ? null : _.defaults(props, this.props.props),
    }, this.opts);
  }

  private readonly stack: Report[] = [];

  /* Flush messages */
  private debouncedFlush = _.debounce(this.flush.bind(this), 1000, {maxWait: 5000}) as () => void;

  protected async flush(): Promise<void> {
    if (this.stack.length === 0) {
      return;
    }
    const tbl = this.peekTable();
    try {
      await this.props.send(this.stack.map(report => ({
        ...report,
        message: removeANSIColor(report.message),
      })), tbl);
    } catch (error) {
      this.props.logger.info(`failed to deliver report to origin service:\n${tbl}`);
      this.props.logger.error(error);
    }
    this.clear();
  }

  private clear(): void {
    this.stack.splice(0, this.stack.length);
  }

  /* Push messages to stack */
  private push(type: Report["type"], message: any, duplicationKey?: string): void {
    if (this.props.props !== null) {
      message = _.defaults(typeof message === "object" && message !== null ? message : {original: message}, this.props.props);
    }
    if (duplicationKey) {
      this.stack.splice(this.stack.findIndex(m => m.key === duplicationKey), 1);
    }
    this.stack.push({
      type,
      message,
      at: new Date(),
      key: duplicationKey,
    });
    process.nextTick(this.debouncedFlush);
  }

  public info(message: any, duplicationKey?: string): void {
    this.push("info", message, duplicationKey);
  }

  public debug(message: any, duplicationKey?: string): void {
    this.push("debug", message, duplicationKey);
  }

  public warn(message: any, duplicationKey?: string): void {
    this.push("warn", message, duplicationKey);
  }

  public error(message: Error | any, duplicationKey?: string): void {
    let err: any = message;
    if (!(message instanceof Error)) {
      if (typeof message === "string") {
        err = new Error(message);
      } else if (typeof message === "object" && message !== null) {
        err = new Error();
        for (const [key, value] of Object.entries(message)) {
          Object.defineProperty(err, key, {value});
        }
      }
    }
    this.push("error", err, duplicationKey || hashObject(err));
  }

  /* Draw message stack as table */
  public peekTable(): string {
    const title = `${kleur.white(`api`)}${kleur.dim(kleur.white(`@${this.gatewayNodeId}`))} -> ${this.props.service.toStringWithoutNodeIds()}`;

    return `\n${title}\n` + table([["type", "message"].map(c => kleur.white(c))].concat(Reporter.reportsToRows(this.stack)), {
      border: getBorderCharacters("norc"),
      columns: {
        0: {alignment: "left", wrapWord: false},
        1: {alignment: "left", wrapWord: false, width: Math.ceil(100 * this.opts!.tableWidthZoomFactor!)},
      },
    });
  }

  public static getTable(reports: ReadonlyArray<Readonly<Report>>): string {
    return "\n" + table([["type", "message"].map(c => kleur.white(c))].concat(Reporter.reportsToRows(reports)), {
      border: getBorderCharacters("norc"),
      columns: {
        0: {alignment: "left", wrapWord: false},
        1: {alignment: "left", wrapWord: false, width: Math.ceil(80)},
      },
    });
  }

  private static tableTypeLabelColors: { [key in Report["type"]]: "green" | "yellow" | "white" | "red" } = {
    info: "green",
    warn: "yellow",
    debug: "white",
    error: "red",
  };

  private static reportsToRows(reports: ReadonlyArray<Readonly<Report>>): any[][] {
    return reports.map(({message, type, at}) => {
      let content: any;
      if (typeof message === "string" || typeof message !== "object" || message === null) {
        content = message;
      } else if (typeof message === "object") {
        content = peekObject(message);
      }
      return [
        kleur[Reporter.tableTypeLabelColors[type]](kleur.bold(type)),
        kleur.dim(at.toISOString()) + "\n" + content,
        // kleur.dim(at.toISOString()),
      ];
    });
  }
}

/*
* remove stack from error instance
* add field notation for object messages
* rearrange indent multiline texts like GraphQL Schema
*/
const nonPreferredToStrings = [Object.prototype.toString, Array.prototype.toString, Error.prototype.toString];
function peekObject(value: any, path: string = "", padEnd: number = 10, depth = 1): any {

  if (typeof value === "object" && value !== null) {
    let stopReading = depth > 4;
    if (stopReading) {
      value = "[...]";
    } else {
      if (value.toString && !nonPreferredToStrings.includes(value.toString)) {
        const tempStr = value.toString();
        stopReading = tempStr !== "[object Object]";
        if (stopReading) {
          padEnd += 4;
        }
      }

      if (!stopReading) {
        return Object.getOwnPropertyNames(value)
          .filter(key => !(key === "stack" && value instanceof Error))
          .reduce((items, key) => items.concat(peekObject(value[key], path ? `${path}.${key}` : key, path ? padEnd + 4 : padEnd, depth + 1)), [] as any[])
          .filter(item => !!item)
          .join("\n");
      }
    }
  }

  if (typeof value === "string") {
    const matches = /^([ \t]+)[^\s]+$/mg.exec(value);
    if (matches) {
      let shortestIndent: string = "";
      for (const match of matches) {
        const indent = match.split(/[^\s]+/)[0];
        if (!shortestIndent || shortestIndent.length > indent.length) {
          shortestIndent = indent;
        }
      }
      value = value.trim().split("\n").map((s, i) => (i === 0 ? "" : " ".repeat(padEnd)) + s.replace(shortestIndent, "").trimRight()).join("\n");
    } else {
      value = value.trim();
    }
  }

  return path ? kleur.dim(`${path}: `.padEnd(padEnd)) + value : value;
}

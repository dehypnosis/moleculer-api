import * as _ from "lodash";
import * as kleur from "kleur";
import * as Winston from "winston";
import { transports, format } from "winston";
import util from "util";
import { Logger, LoggerProps } from "./logger";

export type WinstonLoggerOptions = Winston.LoggerOptions;

export class WinstonLogger extends Logger {
  public static readonly key = "winston";
  private static readonly defaultOptions: WinstonLoggerOptions = {
    level: "info",
    silent: false,
    transports: [
      new transports.Console({
        format: format.combine(
          format.timestamp(),
          format.prettyPrint(),
          format.colorize(),
          format.printf(({level, message, timestamp, label}) => {
            return `${timestamp} ${level} ${kleur.yellow(label)}: ${typeof message === "object" ? WinstonLogger.printObject(message) : message}`;
          }),
        ),
      }),
    ],
  };
  private static printObject = (o: any): string => util.inspect(o, {showHidden: false, depth: 3, colors: true});

  private readonly logger: Winston.Logger;
  protected readonly opts: Winston.LoggerOptions;

  constructor(protected readonly props: LoggerProps, opts?: WinstonLoggerOptions, reusableLogger?: Winston.Logger) {
    super(props);
    this.opts = _.defaults(opts || {}, WinstonLogger.defaultOptions);
    this.logger = reusableLogger || Winston.createLogger(this.opts);
  }

  public get options(): WinstonLoggerOptions {
    return {...this.opts, defaultMeta: { label: this.props.label }};
  }

  public getChild(label: string): Logger {
    return new WinstonLogger({
      ...this.props,
      label: `${this.props.label}/${label}`,
    }, this.opts, this.logger);
  }

  private log(method: "debug" | "error" | "info" | "warn", args: any[]): void {
    for (const message of args) {
      this.logger[method]({label: this.props.label, message});
    }
  }

  public debug(...args: any[]): void {
    this.log("debug", args);
  }

  public error(...args: any[]): void {
    this.log("error", args);
  }

  public info(...args: any[]): void {
    this.log("info", args);
  }

  public warn(...args: any[]): void {
    this.log("warn", args);
  }
}

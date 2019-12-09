import * as Winston from "winston";
import { Logger, LoggerProps } from "./logger";
export declare type WinstonLoggerOptions = Winston.LoggerOptions;
export declare class WinstonLogger extends Logger {
    protected readonly props: LoggerProps;
    static readonly key = "winston";
    private static readonly defaultOptions;
    private static printObject;
    private readonly logger;
    protected readonly opts: Winston.LoggerOptions;
    constructor(props: LoggerProps, opts?: WinstonLoggerOptions, reusableLogger?: Winston.Logger);
    get options(): WinstonLoggerOptions;
    getChild(label: string, resetLabelPrefix?: true): Logger;
    private log;
    debug(...args: any[]): void;
    error(...args: any[]): void;
    info(...args: any[]): void;
    warn(...args: any[]): void;
}

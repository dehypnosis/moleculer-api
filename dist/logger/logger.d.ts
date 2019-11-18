import { HasStaticKey } from "../interface";
export declare type LoggerProps = {
    label: string;
};
export declare type LogLevel = "info" | "warn" | "debug" | "error";
export declare abstract class Logger extends HasStaticKey {
    protected readonly props: LoggerProps;
    constructor(props: LoggerProps, opts?: any);
    abstract info(...args: any[]): void;
    abstract warn(...args: any[]): void;
    abstract debug(...args: any[]): void;
    abstract error(...args: any[]): void;
    abstract getChild(label: string, resetLabelPrefix?: true): Logger;
}

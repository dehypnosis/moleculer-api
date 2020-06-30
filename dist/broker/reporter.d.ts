import { Service } from "./registry";
import { Logger } from "../logger";
export declare type Report = {
    type: "info" | "warn" | "debug" | "error";
    message: any;
    at: Date;
    key?: string;
};
export declare type ReporterProps = {
    logger: Logger;
    service: Readonly<Service>;
    props: {
        [key: string]: any;
    } | null;
    send(messages: Report[], table: string): Promise<void>;
};
export declare type ReporterOptions = {
    tableWidthZoomFactor: number;
};
export declare class Reporter {
    private readonly props;
    private readonly opts?;
    private readonly gatewayNodeId;
    constructor(props: ReporterProps, opts?: Partial<ReporterOptions> | undefined);
    getChild(props: {
        [key: string]: any;
    } | null): Reporter;
    private readonly stack;
    private debouncedFlush;
    protected flush(): Promise<void>;
    private clear;
    private push;
    info(message: any, duplicationKey?: string): void;
    debug(message: any, duplicationKey?: string): void;
    warn(message: any, duplicationKey?: string): void;
    error(message: Error | any, duplicationKey?: string): void;
    peekTable(): string;
    static getTable(reports: ReadonlyArray<Readonly<Report>>): string;
    private static tableTypeLabelColors;
    private static reportsToRows;
}

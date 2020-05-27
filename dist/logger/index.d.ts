import { Logger, LogLevel } from "./logger";
import { WinstonLogger, WinstonLoggerOptions } from "./winston";
export { Logger, LogLevel, WinstonLogger };
export declare const LoggerConstructors: {
    winston: typeof WinstonLogger;
};
export declare type LoggerConstructorOptions = {
    [WinstonLogger.key]: WinstonLoggerOptions;
} | {
    [key: string]: never;
};

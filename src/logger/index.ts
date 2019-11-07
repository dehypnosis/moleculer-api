import { Logger, LogLevel } from "./logger";
import { WinstonLogger, WinstonLoggerOptions } from "./winston";

export { Logger, LogLevel, WinstonLogger };

export const LoggerConstructors = {
  [WinstonLogger.key]: WinstonLogger,
  // [OtherLogger.key]: OtherLogger,
};

export type LoggerConstructorOptions = {
  [WinstonLogger.key]: WinstonLoggerOptions;
}/* | {
  [OtherLogger.key]: OtherLoggerOptions;
}*/ | {
  [key: string]: never;
};

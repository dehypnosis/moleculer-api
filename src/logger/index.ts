import { Logger } from "./logger";
import { WinstonLogger, WinstonLoggerOptions } from "./winston";

export { Logger, WinstonLogger };

type LoggerClass = typeof Logger;

interface LoggerInterface extends LoggerClass {
}

export const LoggerConstructors = {
  [WinstonLogger.key]: WinstonLogger as LoggerInterface,
  // [OtherLogger.key]: OtherLogger as LoggerInterface,
};

export type LoggerConstructorOptions = {
  [WinstonLogger.key]: WinstonLoggerOptions;
}/* | {
  [OtherLogger.key]: OtherLoggerOptions;
}*/ | {
  [key: string]: never;
};

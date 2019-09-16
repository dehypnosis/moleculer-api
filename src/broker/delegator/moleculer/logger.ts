import { Logger, WinstonLogger } from "../../../logger";

export function createMoleculerLoggerOptions(logger: Logger): any {
  if (logger instanceof WinstonLogger) {
    const opts = logger.options;
    return {
      type: "Winston",
      options: {
        level: opts.level,
        winston: opts,
      },
    };
  }
  return true;
}

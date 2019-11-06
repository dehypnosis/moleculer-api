import * as _ from "lodash";
import * as os from "os";
import morgan from "morgan";
import { RecursivePartial } from "../../interface";
import { LogLevel } from "../../logger";
import { ServerApplicationComponentModules } from "../application/component";
import { ServerMiddleware, ServerMiddlewareProps } from "./middleware";

export type LoggingMiddlewareOptions = {
  format: string;
  level: LogLevel;
} & Omit<morgan.Options, "stream">;

/*
  Access Logging middleware
  ref: https://github.com/expressjs/morgan#predefined-formats
*/

export class LoggingMiddleware extends ServerMiddleware {
  public static readonly key = "logging";
  public static readonly autoLoadOptions = {
    format: `:remote-addr - :remote-user ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent" - :response-time ms`,
    level: "info" as LogLevel,
  };
  private readonly opts: LoggingMiddlewareOptions;

  constructor(protected readonly props: ServerMiddlewareProps, opts?: RecursivePartial<LoggingMiddlewareOptions>) {
    super(props);
    this.opts = _.defaultsDeep(opts || {}, LoggingMiddleware.autoLoadOptions);
  }

  public apply(modules: ServerApplicationComponentModules): void {
    const logger = this.props.logger.getChild(os.hostname(), true);
    const {format, level, ...opts} = this.opts;
    const write = (logger[level] || logger.info).bind(logger);

    // http request-response and ws connection log
    modules.http.use(
      morgan(this.opts.format, {
        ...opts,
        stream: {
          write,
        },
      }),
    );
  }
}

import * as kleur from "kleur";
import * as _ from "lodash";
import * as os from "os";
import morgan from "morgan";
import { RecursivePartial } from "../../interface";
import { LogLevel } from "../../logger";
import { ServerApplicationComponentModules } from "../application/component";
import { ServerMiddleware, ServerMiddlewareProps } from "./middleware";

export type LoggingMiddlewareOptions = {
  httpFormat: string;
  wsFormat: string;
  level: LogLevel;
} & Omit<morgan.Options, "stream">;

/*
  Access Logging middleware
  ref: https://github.com/expressjs/morgan#predefined-formats
*/

morgan.token("ws-protocol", req => {
  const protocol = req.headers["sec-websocket-protocol"];
  if (protocol) {
    if (typeof protocol === "string") {
      return protocol;
    }
    return protocol.join(",");
  }
  return "-";
});

morgan.token("ip", req => {
  const forwarded = req.headers && req.headers["x-forwarded-for"];
  if (forwarded) {
    if (typeof forwarded === "string") {
      return forwarded;
    }
    return forwarded[0];
  }
  return req.connection && req.connection.remoteAddress || "-";
});

morgan.token("statusMessage", (req, res) => {
  return res.statusMessage || "-";
});

export class LoggingMiddleware extends ServerMiddleware {
  public static readonly key = "logging";
  public static readonly autoLoadOptions = {
    httpFormat: `:method :url HTTP/:http-version - :status :statusMessage :res[content-length] byte :response-time ms - ${kleur.dim(`":ip" ":referrer" ":user-agent"`)}`,
    wsFormat: `:method :url HTTP/:http-version WebSocket/:ws-protocol - 101 Switching Protocols - ${kleur.dim(`":ip" ":referrer" ":user-agent"`)}`,
    level: "info" as LogLevel,
  };
  private readonly opts: LoggingMiddlewareOptions;

  constructor(protected readonly props: ServerMiddlewareProps, opts?: RecursivePartial<LoggingMiddlewareOptions>) {
    super(props);
    this.opts = _.defaultsDeep(opts || {}, LoggingMiddleware.autoLoadOptions);
  }

  public apply(modules: ServerApplicationComponentModules): void {
    const logger = this.props.logger.getChild(os.hostname(), true);
    const {httpFormat, wsFormat, level, ...restOpts} = this.opts;
    const write = (logger[level] || logger.info).bind(logger);
    const opts = {
      ...restOpts,
      stream: {
        write,
      },
    };

    // http logger
    const httpLogger = morgan(httpFormat, opts);
    modules.http.use(httpLogger);

    // ws connection logger; be noted that it is a trick
    const wsLogger = morgan(wsFormat, opts);
    modules.ws.on("connection", (socket, req) => {
      wsLogger(req as any, {} as any, () => {
      });
    });
  }
}

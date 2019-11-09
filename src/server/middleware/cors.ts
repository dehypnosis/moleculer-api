import * as _ from "lodash";
import cors, { CorsOptions } from "cors";
import { RecursivePartial } from "../../interface";
import { ServerApplicationComponentModules } from "../application/component";
import { ServerMiddleware, ServerMiddlewareProps } from "./middleware";

export type CORSMiddlewareOptions = CorsOptions & { disableForWebSocket: boolean };

/*
  CORS middleware
  ref: https://github.com/expressjs/cors#configuration-options
*/

export class CORSMiddleware extends ServerMiddleware {
  public static readonly key = "cors";
  public static readonly autoLoadOptions: CORSMiddlewareOptions = {
    origin: true,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    disableForWebSocket: false,
  };
  private readonly opts: CORSMiddlewareOptions;

  constructor(protected readonly props: ServerMiddlewareProps, opts?: RecursivePartial<CORSMiddlewareOptions>) {
    super(props);
    this.opts = _.defaultsDeep(opts || {}, CORSMiddleware.autoLoadOptions);
  }

  public apply(modules: ServerApplicationComponentModules): void {
    const {disableForWebSocket, ...opts} = this.opts;
    const corsHandler = cors(opts);
    modules.http.use(corsHandler);

    // tricky way to mimic CORS for websocket
    if (disableForWebSocket !== true) {
      modules.ws.on("connection", (socket, req) => {
        let allowed = false;
        let failed = false;
        corsHandler(req as any, {
          setHeader(key: string) {
            if (key === "Access-Control-Allow-Origin") {
              allowed = true;
            }
          },
          getHeader() {},
        } as any, (error?: any) => {
          if (error) {
            socket.emit("error", error);
            failed = true;
          }
        });
        if (!failed && !allowed) {
          socket.emit("error", new Error("not allowed origin for websocket connection")); // TODO: normalize error
          socket.close();
        }
      });
    }
  }
}

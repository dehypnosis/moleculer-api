import * as _ from "lodash";
import cors, { CorsOptions } from "cors";
import { RecursivePartial } from "../../interface";
import { ServerApplicationComponentModules } from "../application/component";
import { ServerMiddleware, ServerMiddlewareProps } from "./middleware";

export type CORSMiddlewareOptions = CorsOptions;

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
  };
  private readonly opts: CORSMiddlewareOptions;

  constructor(protected readonly props: ServerMiddlewareProps, opts?: RecursivePartial<CORSMiddlewareOptions>) {
    super(props);
    this.opts = _.defaultsDeep(opts || {}, CORSMiddleware.autoLoadOptions);
  }

  public apply(modules: ServerApplicationComponentModules): void {
    const corsHandler = cors(this.opts);
    modules.http.use(corsHandler);
  }
}

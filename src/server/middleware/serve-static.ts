import * as _ from "lodash";
import serveStatic, { ServeStaticOptions } from "serve-static";
import { RecursivePartial } from "../../interface";
import { ServerApplicationComponentModules } from "../application/component";
import { ServerMiddleware, ServerMiddlewareProps } from "./middleware";

export type ServeStaticMiddlewareOptions = {
  dirRootPath: string; /* may use absolute directory for production */
  routeBasePath: string;
} & ServeStaticOptions;
/* eg.
{
  dirRootPath: "./public",
  routeBasePath: "/assets",
}
above options will serve files in `{where the node process running}/public` directory on http://.../assets path
or use absolute path for dirRootPath
*/
export class ServeStaticMiddleware extends ServerMiddleware {
  public static readonly key = "serveStatic";
  public static readonly autoLoadOptions = false;
  private readonly opts: ServeStaticMiddlewareOptions;

  constructor(protected readonly props: ServerMiddlewareProps, opts?: RecursivePartial<ServeStaticMiddlewareOptions>) {
    super(props);
    this.opts = _.defaultsDeep(opts || {}, {
      dirRootPath: "./public",
      routeBasePath: "/assets",
    });
  }

  public apply(modules: ServerApplicationComponentModules): void {
    const {dirRootPath, routeBasePath, ...opts} = this.opts;
    modules.http.use(routeBasePath, serveStatic(dirRootPath, opts));
  }
}

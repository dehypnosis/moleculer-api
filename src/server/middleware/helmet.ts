import * as _ from "lodash";
import helmet, { IHelmetConfiguration } from "helmet";
import { RecursivePartial } from "../../interface";
import { ServerApplicationComponentModules } from "../application/component";
import { ServerMiddleware, ServerMiddlewareProps } from "./middleware";

export type HelmetMiddlewareOptions = IHelmetConfiguration;

/*
  Security middleware
  ref: https://github.com/helmetjs/helmet
*/

export class HelmetMiddleware extends ServerMiddleware {
  public static readonly key = "helmet";
  public static readonly autoLoadOptions = false;
  private readonly opts: HelmetMiddlewareOptions;

  constructor(protected readonly props: ServerMiddlewareProps, opts?: RecursivePartial<HelmetMiddlewareOptions>) {
    super(props);
    this.opts = _.defaultsDeep(opts || {}, {
      // ...
    });
  }

  public apply(modules: ServerApplicationComponentModules): void {
    modules.http.use(helmet(this.opts));
  }
}

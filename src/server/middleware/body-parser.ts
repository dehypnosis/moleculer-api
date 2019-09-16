import * as _ from "lodash";
import * as bodyParser from "body-parser";
import { RecursivePartial } from "../../interface";
import { ServerApplicationComponentModules } from "../application/component";
import { ServerMiddleware, ServerMiddlewareProps } from "./middleware";

export type BodyParserMiddlewareOptions = {
  json: bodyParser.OptionsJson;
  urlencoded: bodyParser.OptionsUrlencoded;
};

/*
  This middleware parse application/json or application/x-www-form-urlencoded
  Will not parse multipart/form-data
*/

export class BodyParserMiddleware extends ServerMiddleware {
  public static readonly key = "bodyParser";
  public static readonly autoLoadOptions: BodyParserMiddlewareOptions = {
    json: {
      strict: false,
    },
    urlencoded: {
      extended: true,
    },
  };
  private readonly opts: BodyParserMiddlewareOptions;

  constructor(protected readonly props: ServerMiddlewareProps, opts?: RecursivePartial<BodyParserMiddlewareOptions>) {
    super(props);
    this.opts = _.defaultsDeep(opts || {}, BodyParserMiddleware.autoLoadOptions);
  }

  public apply(modules: ServerApplicationComponentModules): void {
    modules.http.use(bodyParser.json(this.opts.json));
    modules.http.use(bodyParser.urlencoded(this.opts.urlencoded));
  }
}

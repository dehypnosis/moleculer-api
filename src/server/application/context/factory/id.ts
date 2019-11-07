import * as _ from "lodash";
import * as uuid from "uuid";
import { RecursivePartial } from "../../../../interface";
import { APIRequestContextFactory, APIRequestContextSource, APIRequestContextFactoryProps } from "./factory";

export type IDContextFactoryOptions = {
  requestIdHeaderName: string;
  factory: () => string;
};

/*
  ID Context Factory
*/

export class IDContextFactory extends APIRequestContextFactory<string> {
  public static readonly key = "id";
  public static readonly autoLoadOptions: IDContextFactoryOptions = {
    requestIdHeaderName: "X-Request-Id",
    factory: () => uuid.v4().split("-").join(""),
  };
  private readonly opts: IDContextFactoryOptions;

  constructor(protected readonly props: APIRequestContextFactoryProps, opts?: RecursivePartial<IDContextFactoryOptions>) {
    super(props);
    this.opts = _.defaultsDeep(opts || {}, IDContextFactory.autoLoadOptions);
    this.opts.requestIdHeaderName = this.opts.requestIdHeaderName.toLowerCase();
  }

  public create({ headers }: APIRequestContextSource) {
    const { requestIdHeaderName, factory } = this.opts;
    if (typeof headers[requestIdHeaderName] === "string") return headers[requestIdHeaderName] as string;
    return factory();
  }
}

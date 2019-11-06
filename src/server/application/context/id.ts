import * as _ from "lodash";
import * as uuid from "uuid";
import { RecursivePartial } from "../../../interface";
import { ContextFactory, ContextFactorySource, ContextFactoryProps } from "./context";

export type IDContextFactoryOptions = {
  requestIdHeaderName: string;
  factory: () => string;
};

/*
  ID Context Factory
*/

export class IDContextFactory extends ContextFactory<string> {
  public static readonly key = "id";
  public static readonly autoLoadOptions: IDContextFactoryOptions = {
    requestIdHeaderName: "X-Request-Id",
    factory: () => uuid.v4().split("-").join(""),
  };
  private readonly opts: IDContextFactoryOptions;

  constructor(protected readonly props: ContextFactoryProps, opts?: RecursivePartial<IDContextFactoryOptions>) {
    super(props);
    this.opts = _.defaultsDeep(opts || {}, IDContextFactory.autoLoadOptions);
    this.opts.requestIdHeaderName = this.opts.requestIdHeaderName.toLowerCase();
  }

  public create({ headers }: ContextFactorySource) {
    const { requestIdHeaderName, factory } = this.opts;
    if (typeof headers[requestIdHeaderName] === "string") return headers[requestIdHeaderName] as string;
    return factory();
  }
}

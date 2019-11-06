import * as _ from "lodash";
import * as uuid from "uuid";
import { RecursivePartial } from "../../../interface";
import { ContextFactory, ContextFactorySource, ContextFactoryProps } from "./context";

export type IPContextFactoryOptions = {
  forwardedHeaderName: string;
};

/*
  IP Address Context Factory
*/

export class IPContextFactory extends ContextFactory<string | undefined> {
  public static readonly key = "ip";
  public static readonly autoLoadOptions: IPContextFactoryOptions = {
    forwardedHeaderName: "X-Forwarded-For",
  };

  private readonly opts: IPContextFactoryOptions;

  constructor(protected readonly props: ContextFactoryProps, opts?: RecursivePartial<IPContextFactoryOptions>) {
    super(props);
    this.opts = _.defaultsDeep(opts || {}, IPContextFactory.autoLoadOptions);
    this.opts.forwardedHeaderName = this.opts.forwardedHeaderName.toLowerCase();
  }

  public create(source: ContextFactorySource) {
    const {forwardedHeaderName} = this.opts;
    if (typeof source.headers[forwardedHeaderName] === "string") {
      return source.headers[forwardedHeaderName] as string;
    }
    return source.socket.remoteAddress;
  }
}

import * as _ from "lodash";
import { RecursivePartial } from "../../../../interface";
import { APIRequestContextFactory, APIRequestContextSource, APIRequestContextFactoryProps } from "./factory";

export type IPContextFactoryOptions = {
  forwardedHeaderName: string;
};

/*
  IP Address Context Factory
*/

export class IPContextFactory extends APIRequestContextFactory<string | undefined> {
  public static readonly key = "ip";
  public static readonly autoLoadOptions: IPContextFactoryOptions = {
    forwardedHeaderName: "X-Forwarded-For",
  };

  private readonly opts: IPContextFactoryOptions;

  constructor(protected readonly props: APIRequestContextFactoryProps, opts?: RecursivePartial<IPContextFactoryOptions>) {
    super(props);
    this.opts = _.defaultsDeep(opts || {}, IPContextFactory.autoLoadOptions);
    this.opts.forwardedHeaderName = this.opts.forwardedHeaderName.toLowerCase();
  }

  public create(source: APIRequestContextSource) {
    const {forwardedHeaderName} = this.opts;
    if (typeof source.headers[forwardedHeaderName] === "string") {
      return source.headers[forwardedHeaderName] as string;
    }
    return source.socket.remoteAddress;
  }
}

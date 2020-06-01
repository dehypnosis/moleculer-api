import * as _ from "lodash";
import { RecursivePartial } from "../../../../interface";
import { APIRequestContextFactory, APIRequestContextSource, APIRequestContextFactoryProps } from "./factory";

export type RequestContextFactoryOptions = {};

/*
  Request Context Factory
*/

export type Request = {
  host: string,
  path: string,
  method: string,
  referer: string | null,
};

export class RequestContextFactory extends APIRequestContextFactory<Request> {
  public static readonly key = "request";
  public static readonly autoLoadOptions: RequestContextFactoryOptions = {};
  private readonly opts: RequestContextFactoryOptions;

  constructor(protected readonly props: APIRequestContextFactoryProps, opts?: RecursivePartial<RequestContextFactoryOptions>) {
    super(props);
    this.opts = _.defaultsDeep(opts || {}, RequestContextFactory.autoLoadOptions);
  }

  public create({url, method, headers}: APIRequestContextSource) {
    return {
      host: headers.host!,
      path: url!,
      method: method!,
      referer: headers.referer || null,
    };
  }
}

import * as _ from "lodash";
import { parse as parseUserAgent, Details as UserAgent } from "express-useragent";
import { RecursivePartial } from "../../../../interface";
import { APIRequestContextFactory, APIRequestContextSource, APIRequestContextFactoryProps } from "./factory";

export type UserAgentContextFactoryOptions = {};

/*
  UserAgent Context Factory
  ref: https://github.com/DefinitelyTyped/DefinitelyTyped/blob/master/types/express-useragent/index.d.ts#L18
*/

export class UserAgentContextFactory extends APIRequestContextFactory<UserAgent> {
  public static readonly key = "userAgent";
  public static readonly autoLoadOptions: UserAgentContextFactoryOptions = {};
  private readonly opts: UserAgentContextFactoryOptions;

  constructor(protected readonly props: APIRequestContextFactoryProps, opts?: RecursivePartial<UserAgentContextFactoryOptions>) {
    super(props);
    this.opts = _.defaultsDeep(opts || {}, UserAgentContextFactory.autoLoadOptions);
  }

  public create({headers}: APIRequestContextSource) {
    return parseUserAgent(headers["user-agent"] || "");
  }
}

import * as _ from "lodash";
import { JSONCookies, signedCookies } from "cookie-parser";
import { parse as parseCookieString, CookieParseOptions } from "cookie";
import { RecursivePartial } from "../../../../interface";
import { APIRequestContextFactory, APIRequestContextSource, APIRequestContextFactoryProps } from "./factory";

export type CookieContextFactoryOptions = CookieParseOptions & {
  secrets: string[]; // signed cookie secrets
};

/*
  Cookie Context Factory
  ref: https://github.com/expressjs/cors#configuration-options
*/

export class CookieContextFactory extends APIRequestContextFactory<{ [key: string]: any }> {
  public static readonly key = "cookie";
  public static readonly autoLoadOptions: CookieContextFactoryOptions = {
    secrets: [],
  };
  private readonly opts: CookieContextFactoryOptions;

  constructor(protected readonly props: APIRequestContextFactoryProps, opts?: RecursivePartial<CookieContextFactoryOptions>) {
    super(props);
    this.opts = _.defaultsDeep(opts || {}, CookieContextFactory.autoLoadOptions);
    const {secrets} = this.opts;
    this.opts.secrets = !secrets || Array.isArray(secrets) ? (secrets || []) : [secrets];
  }

  public create({headers}: APIRequestContextSource) {
    if (!headers.cookie) {
      return {};
    }

    const {secrets, ...parseOptions} = this.opts;
    const cookies = parseCookieString(headers.cookie, parseOptions);

    // parse signed cookies
    if (secrets.length !== 0) {
      Object.assign(cookies, signedCookies(cookies, secrets));
    }

    // parse JSON cookies
    return JSONCookies(cookies);
  }
}

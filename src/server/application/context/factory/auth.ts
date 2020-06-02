import * as _ from "lodash";
import url from "url";
import LRUCache, { Options as LRUCacheOptions } from "lru-cache";
import { parse as parseAuthRawToken, Token } from "auth-header";
import { RecursivePartial } from "../../../../interface";
import { Logger } from "../../../../logger";
import { APIRequestContextFactory, APIRequestContextSource, APIRequestContextFactoryProps } from "./factory";

export type AuthRawToken = string;
export type AuthContext = { scope: string[], identity: any | void, client: string | void, token: Token | void };
export type AuthContextParser = (token: Token | void, logger: Logger) => Promise<Partial<AuthContext & { maxAge: number }> | void>;
export type AuthContextImpersonator = (source: APIRequestContextSource, auth: AuthContext, logger: Logger) => Promise<Partial<AuthContext & { maxAge: number }> | void>;
export type AuthContextFactoryOptions = {
  tokenQueryKey: string | false;
  parser: AuthContextParser;
  impersonator: AuthContextImpersonator | false;
  cache: LRUCacheOptions<AuthRawToken, AuthContext>;
};

/*
  Authentication Context Factory
  ref: https://github.com/izaakschroeder/auth-header
*/

export class AuthContextFactory extends APIRequestContextFactory<AuthContext> {
  public static readonly key = "auth";
  public static readonly autoLoadOptions: AuthContextFactoryOptions = {
    async parser(token, logger) {
      logger.warn("AuthContextFactory parser is not implemented:", token);
    },
    // impersonation feature is disabled by default
    impersonator: false,
    cache: {
      max: 1000,
      maxAge: 1000 * 60 * 5, // 5min; default cache max age
    },
    tokenQueryKey: "auth",
  };

  private readonly opts: AuthContextFactoryOptions;
  private readonly cache: LRUCache<AuthRawToken, AuthContext>;

  constructor(protected readonly props: APIRequestContextFactoryProps, opts?: RecursivePartial<AuthContextFactoryOptions>) {
    super(props);
    this.opts = _.defaultsDeep(opts || {}, AuthContextFactory.autoLoadOptions);
    this.cache = new LRUCache(this.opts.cache);
  }

  public async create(source: APIRequestContextSource) {
    // get raw token from header
    let rawToken: AuthRawToken = source.headers.authorization || "";

    // get raw token from query string
    if (!rawToken && source.url && this.opts.tokenQueryKey) {
      const parsedURL = url.parse(source.url, true);
      const tokenQuery = parsedURL.query[this.opts.tokenQueryKey];
      if (typeof tokenQuery === "string") {
        rawToken = tokenQuery;
      }
    }

    // get context from LRU cache
    let context = this.cache.get(rawToken);

    // get context from token
    if (!context) {
      let token: Token | null = null;
      if (rawToken) {
        try {
          token = parseAuthRawToken(rawToken);
        } catch (error) {
          throw new Error("failed to parse authorization token"); // TODO: normalize error
        }
      }

      const parsedContext = await this.opts.parser(token!, this.props.logger);
      context = _.defaultsDeep(
        parsedContext || {},
        {
          scope: [],
          identity: null,
          client: null,
          token,
        },
      );

      // store cache for parsed token
      if (parsedContext) {
        let maxAge = parsedContext.maxAge;
        if (!maxAge || isNaN(maxAge) || maxAge <= 0) maxAge = undefined;
        this.cache.set(rawToken, context!, maxAge);
      }
    }

    // try impersonation
    if (this.opts.impersonator) {
      const impersonatedContext = await this.opts.impersonator(source, context!, this.props.logger);
      if (impersonatedContext) {
        context = _.defaultsDeep(
          context!,
          impersonatedContext,
        );
      }
    }

    return context!;
  }
}

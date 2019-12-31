import * as _ from "lodash";
import LRUCache, { Options as LRUCacheOptions } from "lru-cache";
import { parse as parseAuthorizationHeader, Token } from "auth-header";
import { RecursivePartial } from "../../../../interface";
import { Logger } from "../../../../logger";
import { APIRequestContextFactory, APIRequestContextSource, APIRequestContextFactoryProps } from "./factory";

export type AuthorizationHeader = string;
export type AuthContext = { scope: string[], user: any | void, client: string | void, token: Token | void };
export type AuthContextParser = (token: Token | void, logger: Logger) => Promise<Partial<AuthContext & { maxAge: number }> | void>;
export type AuthContextFactoryOptions = {
  parser: AuthContextParser;
  cache: LRUCacheOptions<AuthorizationHeader, AuthContext>;
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
    cache: {
      max: 1000,
      maxAge: 1000 * 60 * 5, // 5min; default cache max age
    },
  };

  private readonly opts: AuthContextFactoryOptions;
  private readonly cache: LRUCache<AuthorizationHeader, AuthContext>;

  constructor(protected readonly props: APIRequestContextFactoryProps, opts?: RecursivePartial<AuthContextFactoryOptions>) {
    super(props);
    this.opts = _.defaultsDeep(opts || {}, AuthContextFactory.autoLoadOptions);
    this.cache = new LRUCache(this.opts.cache);
  }

  public async create({headers}: APIRequestContextSource) {
    const header: AuthorizationHeader = headers.authorization || "";

    // check LRU cache
    const cachedContext = this.cache.get(header);
    if (cachedContext) return cachedContext;

    // parse token then user, scope
    let token: Token | null = null;
    if (header) {
      try {
        token = parseAuthorizationHeader(header);
      } catch (error) {
        throw new Error("failed to parse authorization header"); // TODO: normalize error
      }
    }

    const partialContext = await this.opts.parser(token!, this.props.logger);
    const context = _.defaultsDeep(
      partialContext || {},
      {
        scope: [],
        user: null,
        client: null,
        token,
      },
    );

    // store cache for parsed token
    if (partialContext) {
      let maxAge = partialContext.maxAge;
      if (!maxAge || isNaN(maxAge) || maxAge <= 0) maxAge = undefined;
      this.cache.set(header, context, maxAge);
    }
    return context;
  }
}

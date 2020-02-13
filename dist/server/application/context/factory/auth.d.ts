import { Options as LRUCacheOptions } from "lru-cache";
import { Token } from "auth-header";
import { RecursivePartial } from "../../../../interface";
import { Logger } from "../../../../logger";
import { APIRequestContextFactory, APIRequestContextSource, APIRequestContextFactoryProps } from "./factory";
export declare type AuthRawToken = string;
export declare type AuthContext = {
    scope: string[];
    user: any | void;
    client: string | void;
    token: Token | void;
};
export declare type AuthContextParser = (token: Token | void, logger: Logger) => Promise<Partial<AuthContext & {
    maxAge: number;
}> | void>;
export declare type AuthContextImpersonator = (source: APIRequestContextSource, auth: AuthContext, logger: Logger) => Promise<Partial<AuthContext & {
    maxAge: number;
}> | void>;
export declare type AuthContextFactoryOptions = {
    tokenQueryKey: string | false;
    parser: AuthContextParser;
    impersonator: AuthContextImpersonator | false;
    cache: LRUCacheOptions<AuthRawToken, AuthContext>;
};
export declare class AuthContextFactory extends APIRequestContextFactory<AuthContext> {
    protected readonly props: APIRequestContextFactoryProps;
    static readonly key = "auth";
    static readonly autoLoadOptions: AuthContextFactoryOptions;
    private readonly opts;
    private readonly cache;
    constructor(props: APIRequestContextFactoryProps, opts?: RecursivePartial<AuthContextFactoryOptions>);
    create(source: APIRequestContextSource): Promise<AuthContext>;
}

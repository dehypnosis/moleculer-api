import { Options as LRUCacheOptions } from "lru-cache";
import { Token } from "auth-header";
import { RecursivePartial } from "../../../../interface";
import { Logger } from "../../../../logger";
import { APIRequestContextFactory, APIRequestContextSource, APIRequestContextFactoryProps } from "./factory";
export declare type AuthorizationHeader = string;
export declare type AuthContext = {
    scope: string[];
    user: any | void;
    client: string | void;
    token: Token | void;
};
export declare type AuthContextParser = (token: Token | void, logger: Logger) => Promise<Partial<AuthContext & {
    maxAge: number;
}> | void>;
export declare type AuthContextFactoryOptions = {
    parser: AuthContextParser;
    cache: LRUCacheOptions<AuthorizationHeader, AuthContext>;
};
export declare class AuthContextFactory extends APIRequestContextFactory<AuthContext> {
    protected readonly props: APIRequestContextFactoryProps;
    static readonly key = "auth";
    static readonly autoLoadOptions: AuthContextFactoryOptions;
    private readonly opts;
    private readonly cache;
    constructor(props: APIRequestContextFactoryProps, opts?: RecursivePartial<AuthContextFactoryOptions>);
    create({ headers }: APIRequestContextSource): Promise<any>;
}

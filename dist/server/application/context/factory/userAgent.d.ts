import { Details as UserAgent } from "express-useragent";
import { RecursivePartial } from "../../../../interface";
import { APIRequestContextFactory, APIRequestContextSource, APIRequestContextFactoryProps } from "./factory";
export declare type UserAgentContextFactoryOptions = {};
export declare class UserAgentContextFactory extends APIRequestContextFactory<UserAgent> {
    protected readonly props: APIRequestContextFactoryProps;
    static readonly key = "userAgent";
    static readonly autoLoadOptions: UserAgentContextFactoryOptions;
    private readonly opts;
    constructor(props: APIRequestContextFactoryProps, opts?: RecursivePartial<UserAgentContextFactoryOptions>);
    create({ headers }: APIRequestContextSource): UserAgent;
}

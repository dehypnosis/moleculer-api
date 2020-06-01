import { Details as UserAgentDetails } from "express-useragent";
import { RecursivePartial } from "../../../../interface";
import { APIRequestContextFactory, APIRequestContextSource, APIRequestContextFactoryProps } from "./factory";
export declare type UserAgentContextFactoryOptions = {};
export declare type UserAgent = Pick<UserAgentDetails, "os" | "platform" | "browser" | "source" | "isMobile">;
export declare class UserAgentContextFactory extends APIRequestContextFactory<UserAgent> {
    protected readonly props: APIRequestContextFactoryProps;
    static readonly key = "userAgent";
    static readonly autoLoadOptions: UserAgentContextFactoryOptions;
    private readonly opts;
    constructor(props: APIRequestContextFactoryProps, opts?: RecursivePartial<UserAgentContextFactoryOptions>);
    create({ headers }: APIRequestContextSource): {
        os: string;
        platform: string;
        browser: string;
        source: string;
        isMobile: boolean;
    };
}

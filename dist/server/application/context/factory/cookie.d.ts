import { CookieParseOptions } from "cookie";
import { RecursivePartial } from "../../../../interface";
import { APIRequestContextFactory, APIRequestContextSource, APIRequestContextFactoryProps } from "./factory";
export declare type CookieContextFactoryOptions = CookieParseOptions & {
    secrets: string[];
};
export declare class CookieContextFactory extends APIRequestContextFactory<{
    [key: string]: any;
}> {
    protected readonly props: APIRequestContextFactoryProps;
    static readonly key = "cookie";
    static readonly autoLoadOptions: CookieContextFactoryOptions;
    private readonly opts;
    constructor(props: APIRequestContextFactoryProps, opts?: RecursivePartial<CookieContextFactoryOptions>);
    create({ headers }: APIRequestContextSource): {
        [x: string]: object | undefined;
    };
}

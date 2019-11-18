import { RecursivePartial } from "../../../../interface";
import { APIRequestContextFactory, APIRequestContextSource, APIRequestContextFactoryProps } from "./factory";
export declare type IPContextFactoryOptions = {
    forwardedHeaderName: string;
};
export declare class IPContextFactory extends APIRequestContextFactory<string | undefined> {
    protected readonly props: APIRequestContextFactoryProps;
    static readonly key = "ip";
    static readonly autoLoadOptions: IPContextFactoryOptions;
    private readonly opts;
    constructor(props: APIRequestContextFactoryProps, opts?: RecursivePartial<IPContextFactoryOptions>);
    create(source: APIRequestContextSource): string | undefined;
}

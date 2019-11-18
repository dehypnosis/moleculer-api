import { RecursivePartial } from "../../../../interface";
import { APIRequestContextFactory, APIRequestContextSource, APIRequestContextFactoryProps } from "./factory";
export declare type IDContextFactoryOptions = {
    requestIdHeaderName: string;
    factory: () => string;
};
export declare class IDContextFactory extends APIRequestContextFactory<string> {
    protected readonly props: APIRequestContextFactoryProps;
    static readonly key = "id";
    static readonly autoLoadOptions: IDContextFactoryOptions;
    private readonly opts;
    constructor(props: APIRequestContextFactoryProps, opts?: RecursivePartial<IDContextFactoryOptions>);
    create({ headers }: APIRequestContextSource): string;
}

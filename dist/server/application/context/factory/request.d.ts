import { RecursivePartial } from "../../../../interface";
import { APIRequestContextFactory, APIRequestContextSource, APIRequestContextFactoryProps } from "./factory";
export declare type RequestContextFactoryOptions = {};
export declare type Request = {
    host: string;
    path: string;
    method: string;
    referer: string | null;
};
export declare class RequestContextFactory extends APIRequestContextFactory<Request> {
    protected readonly props: APIRequestContextFactoryProps;
    static readonly key = "request";
    static readonly autoLoadOptions: RequestContextFactoryOptions;
    private readonly opts;
    constructor(props: APIRequestContextFactoryProps, opts?: RecursivePartial<RequestContextFactoryOptions>);
    create({ url, method, headers }: APIRequestContextSource): {
        host: string;
        path: string;
        method: string;
        referer: string | null;
    };
}

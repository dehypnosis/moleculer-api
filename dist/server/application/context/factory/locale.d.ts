import { RecursivePartial } from "../../../../interface";
import { APIRequestContextFactory, APIRequestContextSource, APIRequestContextFactoryProps } from "./factory";
export declare type LocaleContextFactoryOptions = {
    fallbackLanguage: string;
};
export declare class LocaleContextFactory extends APIRequestContextFactory<{
    language: string;
    region: string | null;
}> {
    protected readonly props: APIRequestContextFactoryProps;
    static readonly key = "locale";
    static readonly autoLoadOptions: LocaleContextFactoryOptions;
    private readonly opts;
    constructor(props: APIRequestContextFactoryProps, opts?: RecursivePartial<LocaleContextFactoryOptions>);
    create({ headers }: APIRequestContextSource): {
        language: string;
        region: string | null;
    };
}

import { PickOptions as PickLanguageOptions } from "accept-language-parser";
import { RecursivePartial } from "../../../../interface";
import { APIRequestContextFactory, APIRequestContextSource, APIRequestContextFactoryProps } from "./factory";
export declare type LocaleContextFactoryOptions = {
    supported: string[];
    fallback: string;
} & PickLanguageOptions;
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

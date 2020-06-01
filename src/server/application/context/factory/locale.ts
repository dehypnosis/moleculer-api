import * as _ from "lodash";
import { parse as parseAcceptLanguage, Language } from "accept-language-parser";
import { RecursivePartial } from "../../../../interface";
import { APIRequestContextFactory, APIRequestContextSource, APIRequestContextFactoryProps } from "./factory";

export type LocaleContextFactoryOptions = {
  fallbackLanguage: string;
};

/*
  Locale Context Factory
  ref:
    language: https://github.com/opentable/accept-language-parser
*/

export class LocaleContextFactory extends APIRequestContextFactory<{
  language: string; // en, ko
  region: string | null; // US, KR
}> {
  public static readonly key = "locale";
  public static readonly autoLoadOptions: LocaleContextFactoryOptions = {
    fallbackLanguage: "en",
  };
  private readonly opts: LocaleContextFactoryOptions;

  constructor(protected readonly props: APIRequestContextFactoryProps, opts?: RecursivePartial<LocaleContextFactoryOptions>) {
    super(props);
    this.opts = _.defaultsDeep(opts || {}, LocaleContextFactory.autoLoadOptions);
  }

  public create({ headers }: APIRequestContextSource) {
    const { fallbackLanguage  } = this.opts;
    const languages = parseAcceptLanguage(headers["accept-language"] || "");
    let language: string = fallbackLanguage;
    let region: string | null = null;
    if (languages.length > 0) {
      language = languages[0].code;
      region = languages.find(l => !!l.region)?.region || null;
    }

    return {
      language,
      region,
    };
  }
}

import * as _ from "lodash";
import { PickOptions as PickLanguageOptions, pick as pickLanguage } from "accept-language-parser";
import { RecursivePartial } from "../../../interface";
import { ContextFactory, ContextFactorySource, ContextFactoryProps } from "./context";

export type LocaleContextFactoryOptions = {
  supported: string[];
  fallback: string;
} & PickLanguageOptions;

/*
  Locale Context Factory
  ref:
    language: https://github.com/opentable/accept-language-parser
*/

export class LocaleContextFactory extends ContextFactory<{
  language: string; // en, ko
  region: string | null; // US, KR
}> {
  public static readonly key = "locale";
  public static readonly autoLoadOptions: LocaleContextFactoryOptions = {
    supported: ["en", "ko"],
    fallback: "en",
    loose: true,
  };
  private readonly opts: LocaleContextFactoryOptions;

  constructor(protected readonly props: ContextFactoryProps, opts?: RecursivePartial<LocaleContextFactoryOptions>) {
    super(props);
    this.opts = _.defaultsDeep(opts || {}, LocaleContextFactory.autoLoadOptions);
  }

  public create({ headers }: ContextFactorySource) {
    const { fallback, supported, ...pickOpts } = this.opts;
    let locale: string | null = null;
    if (headers["accept-language"]) {
      locale = pickLanguage(supported, headers["accept-language"], pickOpts);
    }
    if (!locale) {
      locale = fallback;
    }

    return {
      language: locale.substr(0, 2),
      region: locale.split("-")[1] || null,
    };
  }
}

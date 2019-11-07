export * from "./factory";
import { RecursivePartial } from "../../../../interface";
import { CookieContextFactory, CookieContextFactoryOptions } from "./cookie";
import { APIRequestContextFactory } from "./factory";
import { IPContextFactory, IPContextFactoryOptions } from "./ip";
import { LocaleContextFactory, LocaleContextFactoryOptions } from "./locale";
import { IDContextFactory, IDContextFactoryOptions } from "./id";
import { UserAgentContextFactory, UserAgentContextFactoryOptions } from "./userAgent";

export const APIRequestContextFactoryConstructors = {
  [IDContextFactory.key]: IDContextFactory,
  [IPContextFactory.key]: IPContextFactory,
  [LocaleContextFactory.key]: LocaleContextFactory,
  [CookieContextFactory.key]: CookieContextFactory,
  [UserAgentContextFactory.key]: UserAgentContextFactory,
};

export type APIRequestContextFactoryConstructorOptions = {
  [IDContextFactory.key]: RecursivePartial<IDContextFactoryOptions> | false,
  [IPContextFactory.key]: RecursivePartial<IPContextFactoryOptions> | false,
  [LocaleContextFactory.key]: RecursivePartial<LocaleContextFactoryOptions> | false,
  [CookieContextFactory.key]: RecursivePartial<CookieContextFactoryOptions> | false,
  [UserAgentContextFactory.key]: RecursivePartial<UserAgentContextFactoryOptions> | false,
};

export const defaultAPIRequestContextFactoryConstructorOptions: APIRequestContextFactoryConstructorOptions = {
  [IDContextFactory.key]: IDContextFactory.autoLoadOptions,
  [IPContextFactory.key]: IPContextFactory.autoLoadOptions,
  [LocaleContextFactory.key]: LocaleContextFactory.autoLoadOptions,
  [CookieContextFactory.key]: CookieContextFactory.autoLoadOptions,
  [UserAgentContextFactory.key]: UserAgentContextFactory.autoLoadOptions,
};

export type APIRequestContextProps = { [key in keyof APIRequestContextFactoryConstructorOptions]?: InstanceType<(typeof APIRequestContextFactoryConstructors)[key]> extends APIRequestContextFactory<infer X> ? X : never };

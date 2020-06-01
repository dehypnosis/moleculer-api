export * from "./factory";

import { RecursivePartial } from "../../../../interface";
import { CookieContextFactory, CookieContextFactoryOptions } from "./cookie";
import { APIRequestContextFactory } from "./factory";
import { IPContextFactory, IPContextFactoryOptions } from "./ip";
import { LocaleContextFactory, LocaleContextFactoryOptions } from "./locale";
import { IDContextFactory, IDContextFactoryOptions } from "./id";
import { UserAgentContextFactory, UserAgentContextFactoryOptions } from "./user-agent";
import { RequestContextFactory, RequestContextFactoryOptions } from "./request";
import { AuthContextFactory, AuthContextFactoryOptions } from "./auth";

export { AuthContext, AuthContextParser } from "./auth";
export { createAuthContextOIDCParser, AuthContextOIDCParserOptions } from "./auth.preset";

export const APIRequestContextFactoryConstructors = {
  [IDContextFactory.key]: IDContextFactory,
  [IPContextFactory.key]: IPContextFactory,
  [LocaleContextFactory.key]: LocaleContextFactory,
  [CookieContextFactory.key]: CookieContextFactory,
  [UserAgentContextFactory.key]: UserAgentContextFactory,
  [RequestContextFactory.key]: RequestContextFactory,
  [AuthContextFactory.key]: AuthContextFactory,
};

export type APIRequestContextFactoryConstructorOptions = {
  [IDContextFactory.key]: RecursivePartial<IDContextFactoryOptions> | false,
  [IPContextFactory.key]: RecursivePartial<IPContextFactoryOptions> | false,
  [LocaleContextFactory.key]: RecursivePartial<LocaleContextFactoryOptions> | false,
  [CookieContextFactory.key]: RecursivePartial<CookieContextFactoryOptions> | false,
  [UserAgentContextFactory.key]: RecursivePartial<UserAgentContextFactoryOptions> | false,
  [RequestContextFactory.key]: RecursivePartial<RequestContextFactoryOptions> | false,
  [AuthContextFactory.key]: RecursivePartial<AuthContextFactoryOptions> | false,
};

export const defaultAPIRequestContextFactoryConstructorOptions: APIRequestContextFactoryConstructorOptions = {
  [IDContextFactory.key]: IDContextFactory.autoLoadOptions,
  [IPContextFactory.key]: IPContextFactory.autoLoadOptions,
  [LocaleContextFactory.key]: LocaleContextFactory.autoLoadOptions,
  [CookieContextFactory.key]: CookieContextFactory.autoLoadOptions,
  [UserAgentContextFactory.key]: UserAgentContextFactory.autoLoadOptions,
  [RequestContextFactory.key]: RequestContextFactory.autoLoadOptions,
  [AuthContextFactory.key]: AuthContextFactory.autoLoadOptions,
};

export type APIRequestContextProps = { [key in keyof APIRequestContextFactoryConstructorOptions]?: InstanceType<(typeof APIRequestContextFactoryConstructors)[key]> extends APIRequestContextFactory<infer X> ? X : never };

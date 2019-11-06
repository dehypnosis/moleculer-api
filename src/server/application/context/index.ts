export * from "./context";
import { RecursivePartial } from "../../../interface";
import { ContextFactory } from "./context";
import { CookieContextFactory, CookieContextFactoryOptions } from "./cookie";
import { IPContextFactory, IPContextFactoryOptions } from "./ip";
import { LocaleContextFactory, LocaleContextFactoryOptions } from "./locale";
import { IDContextFactory, IDContextFactoryOptions } from "./id";
import { UserAgentContextFactory, UserAgentContextFactoryOptions } from "./userAgent";

type ContextFactoryClass = typeof ContextFactory;

interface ContextFactoryInterface extends ContextFactoryClass {
}

export const ContextFactoryConstructors = {
  [IDContextFactory.key]: IDContextFactory as ContextFactoryInterface,
  [IPContextFactory.key]: IPContextFactory as ContextFactoryInterface,
  [LocaleContextFactory.key]: LocaleContextFactory as ContextFactoryInterface,
  [CookieContextFactory.key]: CookieContextFactory as ContextFactoryInterface,
  [UserAgentContextFactory.key]: UserAgentContextFactory as ContextFactoryInterface,
};

export type ContextFactoryConstructorOptions = {
  [IDContextFactory.key]: RecursivePartial<IDContextFactoryOptions> | false,
  [IPContextFactory.key]: RecursivePartial<IPContextFactoryOptions> | false,
  [LocaleContextFactory.key]: RecursivePartial<LocaleContextFactoryOptions> | false,
  [CookieContextFactory.key]: RecursivePartial<CookieContextFactoryOptions> | false,
  [UserAgentContextFactory.key]: RecursivePartial<UserAgentContextFactoryOptions> | false,
};

export const defaultContextFactoryConstructorOptions: ContextFactoryConstructorOptions = {
  [IDContextFactory.key]: IDContextFactory.autoLoadOptions,
  [IPContextFactory.key]: IPContextFactory.autoLoadOptions,
  [LocaleContextFactory.key]: LocaleContextFactory.autoLoadOptions,
  [CookieContextFactory.key]: CookieContextFactory.autoLoadOptions,
  [UserAgentContextFactory.key]: UserAgentContextFactory.autoLoadOptions,
};

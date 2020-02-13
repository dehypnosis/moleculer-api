export * from "./factory";
import { RecursivePartial } from "../../../../interface";
import { CookieContextFactory, CookieContextFactoryOptions } from "./cookie";
import { APIRequestContextFactory } from "./factory";
import { IPContextFactory, IPContextFactoryOptions } from "./ip";
import { LocaleContextFactory, LocaleContextFactoryOptions } from "./locale";
import { IDContextFactory, IDContextFactoryOptions } from "./id";
import { UserAgentContextFactory, UserAgentContextFactoryOptions } from "./user-agent";
import { AuthContextFactory, AuthContextFactoryOptions } from "./auth";
export { AuthContext, AuthContextParser } from "./auth";
export { createAuthContextOIDCParser, AuthContextOIDCParserOptions } from "./auth.preset";
export declare const APIRequestContextFactoryConstructors: {
    [IDContextFactory.key]: typeof IDContextFactory;
    [IPContextFactory.key]: typeof IPContextFactory;
    [LocaleContextFactory.key]: typeof LocaleContextFactory;
    [CookieContextFactory.key]: typeof CookieContextFactory;
    [UserAgentContextFactory.key]: typeof UserAgentContextFactory;
    [AuthContextFactory.key]: typeof AuthContextFactory;
};
export declare type APIRequestContextFactoryConstructorOptions = {
    [IDContextFactory.key]: RecursivePartial<IDContextFactoryOptions> | false;
    [IPContextFactory.key]: RecursivePartial<IPContextFactoryOptions> | false;
    [LocaleContextFactory.key]: RecursivePartial<LocaleContextFactoryOptions> | false;
    [CookieContextFactory.key]: RecursivePartial<CookieContextFactoryOptions> | false;
    [UserAgentContextFactory.key]: RecursivePartial<UserAgentContextFactoryOptions> | false;
    [AuthContextFactory.key]: RecursivePartial<AuthContextFactoryOptions> | false;
};
export declare const defaultAPIRequestContextFactoryConstructorOptions: APIRequestContextFactoryConstructorOptions;
export declare type APIRequestContextProps = {
    [key in keyof APIRequestContextFactoryConstructorOptions]?: InstanceType<(typeof APIRequestContextFactoryConstructors)[key]> extends APIRequestContextFactory<infer X> ? X : never;
};

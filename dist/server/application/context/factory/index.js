"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.defaultAPIRequestContextFactoryConstructorOptions = exports.APIRequestContextFactoryConstructors = void 0;
const tslib_1 = require("tslib");
tslib_1.__exportStar(require("./factory"), exports);
const cookie_1 = require("./cookie");
const ip_1 = require("./ip");
const locale_1 = require("./locale");
const id_1 = require("./id");
const user_agent_1 = require("./user-agent");
const request_1 = require("./request");
const auth_1 = require("./auth");
var auth_preset_1 = require("./auth.preset");
Object.defineProperty(exports, "createAuthContextOIDCParser", { enumerable: true, get: function () { return auth_preset_1.createAuthContextOIDCParser; } });
exports.APIRequestContextFactoryConstructors = {
    [id_1.IDContextFactory.key]: id_1.IDContextFactory,
    [ip_1.IPContextFactory.key]: ip_1.IPContextFactory,
    [locale_1.LocaleContextFactory.key]: locale_1.LocaleContextFactory,
    [cookie_1.CookieContextFactory.key]: cookie_1.CookieContextFactory,
    [user_agent_1.UserAgentContextFactory.key]: user_agent_1.UserAgentContextFactory,
    [request_1.RequestContextFactory.key]: request_1.RequestContextFactory,
    [auth_1.AuthContextFactory.key]: auth_1.AuthContextFactory,
};
exports.defaultAPIRequestContextFactoryConstructorOptions = {
    [id_1.IDContextFactory.key]: id_1.IDContextFactory.autoLoadOptions,
    [ip_1.IPContextFactory.key]: ip_1.IPContextFactory.autoLoadOptions,
    [locale_1.LocaleContextFactory.key]: locale_1.LocaleContextFactory.autoLoadOptions,
    [cookie_1.CookieContextFactory.key]: cookie_1.CookieContextFactory.autoLoadOptions,
    [user_agent_1.UserAgentContextFactory.key]: user_agent_1.UserAgentContextFactory.autoLoadOptions,
    [request_1.RequestContextFactory.key]: request_1.RequestContextFactory.autoLoadOptions,
    [auth_1.AuthContextFactory.key]: auth_1.AuthContextFactory.autoLoadOptions,
};
//# sourceMappingURL=index.js.map
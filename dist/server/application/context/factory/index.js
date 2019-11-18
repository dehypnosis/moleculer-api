"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
tslib_1.__exportStar(require("./factory"), exports);
const cookie_1 = require("./cookie");
const ip_1 = require("./ip");
const locale_1 = require("./locale");
const id_1 = require("./id");
const userAgent_1 = require("./userAgent");
exports.APIRequestContextFactoryConstructors = {
    [id_1.IDContextFactory.key]: id_1.IDContextFactory,
    [ip_1.IPContextFactory.key]: ip_1.IPContextFactory,
    [locale_1.LocaleContextFactory.key]: locale_1.LocaleContextFactory,
    [cookie_1.CookieContextFactory.key]: cookie_1.CookieContextFactory,
    [userAgent_1.UserAgentContextFactory.key]: userAgent_1.UserAgentContextFactory,
};
exports.defaultAPIRequestContextFactoryConstructorOptions = {
    [id_1.IDContextFactory.key]: id_1.IDContextFactory.autoLoadOptions,
    [ip_1.IPContextFactory.key]: ip_1.IPContextFactory.autoLoadOptions,
    [locale_1.LocaleContextFactory.key]: locale_1.LocaleContextFactory.autoLoadOptions,
    [cookie_1.CookieContextFactory.key]: cookie_1.CookieContextFactory.autoLoadOptions,
    [userAgent_1.UserAgentContextFactory.key]: userAgent_1.UserAgentContextFactory.autoLoadOptions,
};
//# sourceMappingURL=index.js.map
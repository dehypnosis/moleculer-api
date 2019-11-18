"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const _ = tslib_1.__importStar(require("lodash"));
const accept_language_parser_1 = require("accept-language-parser");
const factory_1 = require("./factory");
/*
  Locale Context Factory
  ref:
    language: https://github.com/opentable/accept-language-parser
*/
class LocaleContextFactory extends factory_1.APIRequestContextFactory {
    constructor(props, opts) {
        super(props);
        this.props = props;
        this.opts = _.defaultsDeep(opts || {}, LocaleContextFactory.autoLoadOptions);
    }
    create({ headers }) {
        const _a = this.opts, { fallback, supported } = _a, pickOpts = tslib_1.__rest(_a, ["fallback", "supported"]);
        let locale = null;
        if (headers["accept-language"]) {
            locale = accept_language_parser_1.pick(supported, headers["accept-language"], pickOpts);
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
exports.LocaleContextFactory = LocaleContextFactory;
LocaleContextFactory.key = "locale";
LocaleContextFactory.autoLoadOptions = {
    supported: ["en", "ko"],
    fallback: "en",
    loose: true,
};
//# sourceMappingURL=locale.js.map
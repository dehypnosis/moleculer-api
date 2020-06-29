"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LocaleContextFactory = void 0;
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
        var _a;
        const { fallbackLanguage } = this.opts;
        const languages = accept_language_parser_1.parse(headers["accept-language"] || "");
        let language = fallbackLanguage;
        let region = null;
        if (languages.length > 0) {
            language = languages[0].code;
            region = ((_a = languages.find(l => !!l.region)) === null || _a === void 0 ? void 0 : _a.region) || null;
        }
        return {
            language,
            region,
        };
    }
}
exports.LocaleContextFactory = LocaleContextFactory;
LocaleContextFactory.key = "locale";
LocaleContextFactory.autoLoadOptions = {
    fallbackLanguage: "en",
};
//# sourceMappingURL=locale.js.map
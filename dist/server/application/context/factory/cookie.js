"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const _ = tslib_1.__importStar(require("lodash"));
const cookie_parser_1 = require("cookie-parser");
const cookie_1 = require("cookie");
const factory_1 = require("./factory");
/*
  Cookie Context Factory
  ref: https://github.com/expressjs/cors#configuration-options
*/
class CookieContextFactory extends factory_1.APIRequestContextFactory {
    constructor(props, opts) {
        super(props);
        this.props = props;
        this.opts = _.defaultsDeep(opts || {}, CookieContextFactory.autoLoadOptions);
        const { secrets } = this.opts;
        this.opts.secrets = !secrets || Array.isArray(secrets) ? (secrets || []) : [secrets];
    }
    create({ headers }) {
        if (!headers.cookie) {
            return {};
        }
        const _a = this.opts, { secrets } = _a, parseOptions = tslib_1.__rest(_a, ["secrets"]);
        const cookies = cookie_1.parse(headers.cookie, parseOptions);
        // parse signed cookies
        if (secrets.length !== 0) {
            Object.assign(cookies, cookie_parser_1.signedCookies(cookies, secrets));
        }
        // parse JSON cookies
        return cookie_parser_1.JSONCookies(cookies);
    }
}
exports.CookieContextFactory = CookieContextFactory;
CookieContextFactory.key = "cookie";
CookieContextFactory.autoLoadOptions = {
    secrets: [],
};
//# sourceMappingURL=cookie.js.map
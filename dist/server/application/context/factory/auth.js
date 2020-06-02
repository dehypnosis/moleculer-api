"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthContextFactory = void 0;
const tslib_1 = require("tslib");
const _ = tslib_1.__importStar(require("lodash"));
const url_1 = tslib_1.__importDefault(require("url"));
const lru_cache_1 = tslib_1.__importDefault(require("lru-cache"));
const auth_header_1 = require("auth-header");
const factory_1 = require("./factory");
/*
  Authentication Context Factory
  ref: https://github.com/izaakschroeder/auth-header
*/
let AuthContextFactory = /** @class */ (() => {
    class AuthContextFactory extends factory_1.APIRequestContextFactory {
        constructor(props, opts) {
            super(props);
            this.props = props;
            this.opts = _.defaultsDeep(opts || {}, AuthContextFactory.autoLoadOptions);
            this.cache = new lru_cache_1.default(this.opts.cache);
        }
        create(source) {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                // get raw token from header
                let rawToken = source.headers.authorization || "";
                // get raw token from query string
                if (!rawToken && source.url && this.opts.tokenQueryKey) {
                    const parsedURL = url_1.default.parse(source.url, true);
                    const tokenQuery = parsedURL.query[this.opts.tokenQueryKey];
                    if (typeof tokenQuery === "string") {
                        rawToken = tokenQuery;
                    }
                }
                // get context from LRU cache
                let context = this.cache.get(rawToken);
                // get context from token
                if (!context) {
                    let token = null;
                    if (rawToken) {
                        try {
                            token = auth_header_1.parse(rawToken);
                        }
                        catch (error) {
                            throw new Error("failed to parse authorization token"); // TODO: normalize error
                        }
                    }
                    const parsedContext = yield this.opts.parser(token, this.props.logger);
                    context = _.defaultsDeep(parsedContext || {}, {
                        scope: [],
                        identity: null,
                        client: null,
                        token,
                    });
                    // store cache for parsed token
                    if (parsedContext) {
                        let maxAge = parsedContext.maxAge;
                        if (!maxAge || isNaN(maxAge) || maxAge <= 0)
                            maxAge = undefined;
                        this.cache.set(rawToken, context, maxAge);
                    }
                }
                // try impersonation
                if (this.opts.impersonator) {
                    const impersonatedContext = yield this.opts.impersonator(source, context, this.props.logger);
                    if (impersonatedContext) {
                        context = _.defaultsDeep(context, impersonatedContext);
                    }
                }
                return context;
            });
        }
    }
    AuthContextFactory.key = "auth";
    AuthContextFactory.autoLoadOptions = {
        parser(token, logger) {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                logger.warn("AuthContextFactory parser is not implemented:", token);
            });
        },
        // impersonation feature is disabled by default
        impersonator: false,
        cache: {
            max: 1000,
            maxAge: 1000 * 60 * 5,
        },
        tokenQueryKey: "auth",
    };
    return AuthContextFactory;
})();
exports.AuthContextFactory = AuthContextFactory;
//# sourceMappingURL=auth.js.map
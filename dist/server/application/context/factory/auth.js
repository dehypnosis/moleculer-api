"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const _ = tslib_1.__importStar(require("lodash"));
const lru_cache_1 = tslib_1.__importDefault(require("lru-cache"));
const auth_header_1 = require("auth-header");
const factory_1 = require("./factory");
/*
  Authentication Context Factory
  ref: https://github.com/izaakschroeder/auth-header
*/
class AuthContextFactory extends factory_1.APIRequestContextFactory {
    constructor(props, opts) {
        super(props);
        this.props = props;
        this.opts = _.defaultsDeep(opts || {}, AuthContextFactory.autoLoadOptions);
        this.cache = new lru_cache_1.default(this.opts.cache);
    }
    create({ headers }) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const header = headers.authorization || "";
            // check LRU cache
            const cachedContext = this.cache.get(header);
            if (cachedContext)
                return cachedContext;
            // parse token then user, scope
            let token = null;
            if (header) {
                try {
                    token = auth_header_1.parse(header);
                }
                catch (error) {
                    throw new Error("failed to parse authorization header"); // TODO: normalize error
                }
            }
            const partialContext = yield this.opts.parser(token, this.props.logger);
            const context = _.defaultsDeep(partialContext || {}, {
                scope: [],
                user: null,
                client: null,
                token,
            });
            // store cache for parsed token
            if (partialContext) {
                let maxAge = partialContext.maxAge;
                if (!maxAge || isNaN(maxAge) || maxAge <= 0)
                    maxAge = undefined;
                this.cache.set(header, context, maxAge);
            }
            return context;
        });
    }
}
exports.AuthContextFactory = AuthContextFactory;
AuthContextFactory.key = "auth";
AuthContextFactory.autoLoadOptions = {
    parser(token, logger) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            logger.warn("AuthContextFactory parser is not implemented:", token);
        });
    },
    cache: {
        max: 1000,
        maxAge: 1000 * 60 * 5,
    },
};
//# sourceMappingURL=auth.js.map
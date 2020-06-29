"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserAgentContextFactory = void 0;
const tslib_1 = require("tslib");
const _ = tslib_1.__importStar(require("lodash"));
const express_useragent_1 = require("express-useragent");
const factory_1 = require("./factory");
class UserAgentContextFactory extends factory_1.APIRequestContextFactory {
    constructor(props, opts) {
        super(props);
        this.props = props;
        this.opts = _.defaultsDeep(opts || {}, UserAgentContextFactory.autoLoadOptions);
    }
    create({ headers }) {
        const { os, platform, browser, source, isMobile } = express_useragent_1.parse(headers["user-agent"] || "");
        return { os, platform, browser, source, isMobile };
    }
}
exports.UserAgentContextFactory = UserAgentContextFactory;
UserAgentContextFactory.key = "userAgent";
UserAgentContextFactory.autoLoadOptions = {};
//# sourceMappingURL=user-agent.js.map
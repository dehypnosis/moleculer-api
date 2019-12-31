"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const _ = tslib_1.__importStar(require("lodash"));
const express_useragent_1 = require("express-useragent");
const factory_1 = require("./factory");
/*
  UserAgent Context Factory
  ref: https://github.com/DefinitelyTyped/DefinitelyTyped/blob/master/types/express-useragent/index.d.ts#L18
*/
class UserAgentContextFactory extends factory_1.APIRequestContextFactory {
    constructor(props, opts) {
        super(props);
        this.props = props;
        this.opts = _.defaultsDeep(opts || {}, UserAgentContextFactory.autoLoadOptions);
    }
    create({ headers }) {
        return express_useragent_1.parse(headers["user-agent"] || "");
    }
}
exports.UserAgentContextFactory = UserAgentContextFactory;
UserAgentContextFactory.key = "userAgent";
UserAgentContextFactory.autoLoadOptions = {};
//# sourceMappingURL=user-agent.js.map
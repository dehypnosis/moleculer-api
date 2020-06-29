"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IPContextFactory = void 0;
const tslib_1 = require("tslib");
const _ = tslib_1.__importStar(require("lodash"));
const factory_1 = require("./factory");
/*
  IP Address Context Factory
*/
class IPContextFactory extends factory_1.APIRequestContextFactory {
    constructor(props, opts) {
        super(props);
        this.props = props;
        this.opts = _.defaultsDeep(opts || {}, IPContextFactory.autoLoadOptions);
        this.opts.forwardedHeaderName = this.opts.forwardedHeaderName.toLowerCase();
    }
    create(source) {
        const { forwardedHeaderName } = this.opts;
        if (typeof source.headers[forwardedHeaderName] === "string") {
            return source.headers[forwardedHeaderName];
        }
        return source.socket.remoteAddress;
    }
}
exports.IPContextFactory = IPContextFactory;
IPContextFactory.key = "ip";
IPContextFactory.autoLoadOptions = {
    forwardedHeaderName: "X-Forwarded-For",
};
//# sourceMappingURL=ip.js.map
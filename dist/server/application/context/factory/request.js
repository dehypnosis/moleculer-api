"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RequestContextFactory = void 0;
const tslib_1 = require("tslib");
const _ = tslib_1.__importStar(require("lodash"));
const factory_1 = require("./factory");
class RequestContextFactory extends factory_1.APIRequestContextFactory {
    constructor(props, opts) {
        super(props);
        this.props = props;
        this.opts = _.defaultsDeep(opts || {}, RequestContextFactory.autoLoadOptions);
    }
    create({ url, method, headers }) {
        return {
            host: headers.host,
            path: url,
            method: method,
            referer: headers.referer || null,
        };
    }
}
exports.RequestContextFactory = RequestContextFactory;
RequestContextFactory.key = "request";
RequestContextFactory.autoLoadOptions = {};
//# sourceMappingURL=request.js.map
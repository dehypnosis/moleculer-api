"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IDContextFactory = void 0;
const tslib_1 = require("tslib");
const _ = tslib_1.__importStar(require("lodash"));
const uuid = tslib_1.__importStar(require("uuid"));
const factory_1 = require("./factory");
/*
  ID Context Factory
*/
let IDContextFactory = /** @class */ (() => {
    class IDContextFactory extends factory_1.APIRequestContextFactory {
        constructor(props, opts) {
            super(props);
            this.props = props;
            this.opts = _.defaultsDeep(opts || {}, IDContextFactory.autoLoadOptions);
            this.opts.requestIdHeaderName = this.opts.requestIdHeaderName.toLowerCase();
        }
        create({ headers }) {
            const { requestIdHeaderName, factory } = this.opts;
            if (typeof headers[requestIdHeaderName] === "string")
                return headers[requestIdHeaderName];
            return factory();
        }
    }
    IDContextFactory.key = "id";
    IDContextFactory.autoLoadOptions = {
        requestIdHeaderName: "X-Request-Id",
        factory: () => uuid.v4().split("-").join(""),
    };
    return IDContextFactory;
})();
exports.IDContextFactory = IDContextFactory;
//# sourceMappingURL=id.js.map
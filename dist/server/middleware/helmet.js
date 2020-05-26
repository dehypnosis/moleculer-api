"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HelmetMiddleware = void 0;
const tslib_1 = require("tslib");
const _ = tslib_1.__importStar(require("lodash"));
const helmet_1 = tslib_1.__importDefault(require("helmet"));
const middleware_1 = require("./middleware");
/*
  Security middleware
  ref: https://github.com/helmetjs/helmet
*/
let HelmetMiddleware = /** @class */ (() => {
    class HelmetMiddleware extends middleware_1.ServerMiddleware {
        constructor(props, opts) {
            super(props);
            this.props = props;
            this.opts = _.defaultsDeep(opts || {}, {
            // ...
            });
        }
        apply(modules) {
            modules.http.use(helmet_1.default(this.opts));
        }
    }
    HelmetMiddleware.key = "helmet";
    HelmetMiddleware.autoLoadOptions = false;
    return HelmetMiddleware;
})();
exports.HelmetMiddleware = HelmetMiddleware;
//# sourceMappingURL=helmet.js.map
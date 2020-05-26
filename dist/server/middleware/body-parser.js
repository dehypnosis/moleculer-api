"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BodyParserMiddleware = void 0;
const tslib_1 = require("tslib");
const _ = tslib_1.__importStar(require("lodash"));
const bodyParser = tslib_1.__importStar(require("body-parser"));
const middleware_1 = require("./middleware");
/*
  This middleware parse application/json or application/x-www-form-urlencoded
  Will not parse multipart/form-data
*/
let BodyParserMiddleware = /** @class */ (() => {
    class BodyParserMiddleware extends middleware_1.ServerMiddleware {
        constructor(props, opts) {
            super(props);
            this.props = props;
            this.opts = _.defaultsDeep(opts || {}, BodyParserMiddleware.autoLoadOptions);
        }
        apply(modules) {
            modules.http.use(bodyParser.json(this.opts.json));
            modules.http.use(bodyParser.urlencoded(this.opts.urlencoded));
        }
    }
    BodyParserMiddleware.key = "bodyParser";
    BodyParserMiddleware.autoLoadOptions = {
        json: {
            strict: false,
        },
        urlencoded: {
            extended: true,
        },
    };
    return BodyParserMiddleware;
})();
exports.BodyParserMiddleware = BodyParserMiddleware;
//# sourceMappingURL=body-parser.js.map
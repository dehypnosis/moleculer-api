"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const _ = tslib_1.__importStar(require("lodash"));
const serve_static_1 = tslib_1.__importDefault(require("serve-static"));
const middleware_1 = require("./middleware");
/* eg.
{
  dirRootPath: "./public",
  routeBasePath: "/assets",
}
above options will serve files in `{where the node process running}/public` directory on http://.../assets path
or use absolute path for dirRootPath
*/
class ServeStaticMiddleware extends middleware_1.ServerMiddleware {
    constructor(props, opts) {
        super(props);
        this.props = props;
        this.opts = _.defaultsDeep(opts || {}, {
            dirRootPath: "./public",
            routeBasePath: "/assets",
        });
    }
    apply(modules) {
        const _a = this.opts, { dirRootPath, routeBasePath } = _a, opts = tslib_1.__rest(_a, ["dirRootPath", "routeBasePath"]);
        modules.http.use(routeBasePath, serve_static_1.default(dirRootPath, opts));
    }
}
exports.ServeStaticMiddleware = ServeStaticMiddleware;
ServeStaticMiddleware.key = "serveStatic";
ServeStaticMiddleware.autoLoadOptions = false;
//# sourceMappingURL=serve-static.js.map
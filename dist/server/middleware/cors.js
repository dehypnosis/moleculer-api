"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CORSMiddleware = void 0;
const tslib_1 = require("tslib");
const _ = tslib_1.__importStar(require("lodash"));
const cors_1 = tslib_1.__importDefault(require("cors"));
const middleware_1 = require("./middleware");
/*
  CORS middleware
  ref: https://github.com/expressjs/cors#configuration-options
*/
class CORSMiddleware extends middleware_1.ServerMiddleware {
    constructor(props, opts) {
        super(props);
        this.props = props;
        this.opts = _.defaultsDeep(opts || {}, CORSMiddleware.autoLoadOptions);
    }
    apply(modules) {
        const _a = this.opts, { disableForWebSocket } = _a, opts = tslib_1.__rest(_a, ["disableForWebSocket"]);
        const corsHandler = cors_1.default(opts);
        modules.http.use(corsHandler);
        // tricky way to mimic CORS for websocket
        if (disableForWebSocket !== true) {
            modules.ws.on("connection", (socket, req) => {
                let allowed = false;
                let failed = false;
                corsHandler(req, {
                    setHeader(key) {
                        if (key === "Access-Control-Allow-Origin") {
                            allowed = true;
                        }
                    },
                    getHeader() { },
                }, (error) => {
                    if (error) {
                        socket.emit("error", error);
                        failed = true;
                    }
                });
                if (!failed && !allowed) {
                    socket.emit("error", new Error("not allowed origin for websocket connection")); // TODO: normalize error
                    socket.close();
                }
            });
        }
    }
}
exports.CORSMiddleware = CORSMiddleware;
CORSMiddleware.key = "cors";
CORSMiddleware.autoLoadOptions = {
    origin: true,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    disableForWebSocket: false,
};
//# sourceMappingURL=cors.js.map
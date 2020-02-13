"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const kleur = tslib_1.__importStar(require("kleur"));
const _ = tslib_1.__importStar(require("lodash"));
const os = tslib_1.__importStar(require("os"));
const morgan_1 = tslib_1.__importDefault(require("morgan"));
const middleware_1 = require("./middleware");
const context_1 = require("../application/context");
/*
  Access Logging middleware
  ref: https://github.com/expressjs/morgan#predefined-formats
*/
morgan_1.default.token("ws-protocol", req => {
    const protocol = req.headers["sec-websocket-protocol"];
    if (protocol) {
        if (typeof protocol === "string") {
            return protocol;
        }
        return protocol.join(",");
    }
    return "-";
});
morgan_1.default.token("ip", req => {
    const forwarded = req.headers && (req.headers["x-forwarded-for"] || req.headers["x-forwarded-proto"]);
    if (forwarded) {
        if (typeof forwarded === "string") {
            return forwarded;
        }
        return forwarded[0];
    }
    return req.connection && req.connection.remoteAddress || "-";
});
morgan_1.default.token("statusMessage", (req, res) => {
    return res.statusMessage || "-";
});
morgan_1.default.token("context", (req, res, key) => {
    const context = context_1.APIRequestContext.findProps(req);
    if (!context)
        return "-";
    return (_.get(context, key, "-") || "-").toString();
});
class LoggingMiddleware extends middleware_1.ServerMiddleware {
    constructor(props, opts) {
        super(props);
        this.props = props;
        this.opts = _.defaultsDeep(opts || {}, LoggingMiddleware.autoLoadOptions);
    }
    apply(modules) {
        const logger = this.props.logger.getChild(os.hostname(), true);
        const _a = this.opts, { httpFormat, wsFormat, level } = _a, restOpts = tslib_1.__rest(_a, ["httpFormat", "wsFormat", "level"]);
        const write = (logger[level] || logger.info).bind(logger);
        const opts = Object.assign(Object.assign({}, restOpts), { stream: {
                write,
            } });
        // http logger
        const httpLogger = morgan_1.default(httpFormat, opts);
        modules.http.use(httpLogger);
        // ws connection logger; be noted that it is a trick
        const wsLogger = morgan_1.default(wsFormat, opts);
        modules.ws.on("connection", (socket, req) => {
            wsLogger(req, {}, () => {
            });
        });
    }
}
exports.LoggingMiddleware = LoggingMiddleware;
LoggingMiddleware.key = "logging";
LoggingMiddleware.autoLoadOptions = {
    httpFormat: `:method ":url" HTTP/:http-version - :status :statusMessage :res[content-length] byte :response-time ms - ${kleur.dim(`":context[id]" ":ip" ":referrer" ":user-agent"`)} - ${kleur.dim(`":context[auth.user.sub]" ":context[auth.user.email]" ":context[auth.scope]" ":context[auth.client]"`)}`,
    wsFormat: `:method ":url" HTTP/:http-version WebSocket/:ws-protocol - 101 Switching Protocols - byte - ms - ${kleur.dim(`":context[id]" ":ip" ":referrer" ":user-agent"`)} - ${kleur.dim(`":context[auth.user.sub]" ":context[auth.user.email]" ":context[auth.scope]" ":context[auth.client]"`)}`,
    level: "info",
};
//# sourceMappingURL=logging.js.map
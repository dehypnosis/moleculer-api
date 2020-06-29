"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ErrorMiddleware = void 0;
const tslib_1 = require("tslib");
const _ = tslib_1.__importStar(require("lodash"));
const middleware_1 = require("./middleware");
/*
  Uncaught Error handling middleware
*/
class ErrorMiddleware extends middleware_1.ServerMiddleware {
    constructor(props, opts) {
        super(props);
        this.props = props;
        this.opts = _.defaultsDeep(opts || {}, ErrorMiddleware.autoLoadOptions);
    }
    apply(modules) {
        /* HTTP Error & Not Found handling */
        const httpNotFoundHandler = this.handleHTTPNotFound.bind(this);
        const httpErrorHandler = this.handleHTTPError.bind(this);
        // arrange error handler to the last or stack on any sub app mounts
        // ref: http://expressjs.com/en/guide/error-handling.html
        const arrangeHTTPErrorHandlers = () => {
            const layers = modules.http._router.stack;
            // not found handler should be the last-1 layer
            const notFoundHandlerIndex = layers.findIndex((layer) => layer.handle === httpNotFoundHandler);
            console.assert(notFoundHandlerIndex !== -1, "where the http not found handler gone?");
            layers.push(...layers.splice(notFoundHandlerIndex, 1));
            // error handler should be the last layer
            const errorHandlerIndex = layers.findIndex((layer) => layer.handle === httpErrorHandler);
            console.assert(errorHandlerIndex !== -1, "where the http error handler gone?");
            layers.push(...layers.splice(errorHandlerIndex, 1));
        };
        // mount handlers
        modules.http.use(httpNotFoundHandler);
        modules.http.use(httpErrorHandler);
        arrangeHTTPErrorHandlers();
        modules.http.on("update", arrangeHTTPErrorHandlers);
        /* WebSocket Server Error handling */
        modules.ws.on("error", this.handleWebSocketError.bind(this));
    }
    handleHTTPError(error, req, res, next) {
        this.props.logger.error(error);
        if (res.headersSent) {
            return next(error);
        }
        const err = this.formatError(error);
        let status = typeof err !== "string" && err.error && (err.error.status || err.error.statusCode || err.error.code) || 500;
        if (isNaN(status))
            status = 500;
        res.status(status).json(err); // TODO: normalize error
    }
    handleHTTPNotFound(req, res, next) {
        res.status(404).end();
    }
    handleWebSocketError(error, socket, req) {
        if (socket) {
            socket.send(this.formatError(error, true)); // TODO: normalize error
        }
    }
    formatError(error, stringify = false) {
        const { responseFormat, displayErrorStack } = this.opts;
        let value = error;
        if (typeof error === "object" && error !== null) {
            const obj = {};
            for (const key of Object.getOwnPropertyNames(error)) {
                if (key !== "stack" || displayErrorStack) {
                    obj[key] = error[key];
                }
            }
            value = obj;
        }
        if (responseFormat) {
            try {
                value = responseFormat(value);
            }
            catch (e) {
                this.props.logger.error("failed to format error", e);
            }
        }
        let result = { error: value };
        if (stringify) {
            try {
                result = JSON.stringify(result);
            }
            catch (e) {
                console.error("failed to stringify error", e);
                result = JSON.stringify({ error: error.toString(), truncated: true });
            }
        }
        return result;
    }
}
exports.ErrorMiddleware = ErrorMiddleware;
ErrorMiddleware.key = "error";
ErrorMiddleware.autoLoadOptions = {
    displayErrorStack: true,
};
//# sourceMappingURL=error.js.map
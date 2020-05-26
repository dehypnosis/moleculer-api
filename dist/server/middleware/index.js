"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.defaultServerMiddlewareConstructorOptions = exports.ServerMiddlewareConstructors = void 0;
var middleware_1 = require("./middleware");
Object.defineProperty(exports, "ServerMiddleware", { enumerable: true, get: function () { return middleware_1.ServerMiddleware; } });
const cors_1 = require("./cors");
const helmet_1 = require("./helmet");
const serve_static_1 = require("./serve-static");
const body_parser_1 = require("./body-parser");
const logging_1 = require("./logging");
const error_1 = require("./error");
exports.ServerMiddlewareConstructors = {
    [helmet_1.HelmetMiddleware.key]: helmet_1.HelmetMiddleware,
    [cors_1.CORSMiddleware.key]: cors_1.CORSMiddleware,
    [serve_static_1.ServeStaticMiddleware.key]: serve_static_1.ServeStaticMiddleware,
    [body_parser_1.BodyParserMiddleware.key]: body_parser_1.BodyParserMiddleware,
    [logging_1.LoggingMiddleware.key]: logging_1.LoggingMiddleware,
    // [OtherMiddleware.key]: OtherMiddleware,
    [error_1.ErrorMiddleware.key]: error_1.ErrorMiddleware,
};
/* orders matter */
exports.defaultServerMiddlewareConstructorOptions = {
    [helmet_1.HelmetMiddleware.key]: helmet_1.HelmetMiddleware.autoLoadOptions,
    [cors_1.CORSMiddleware.key]: cors_1.CORSMiddleware.autoLoadOptions,
    [serve_static_1.ServeStaticMiddleware.key]: serve_static_1.ServeStaticMiddleware.autoLoadOptions,
    [body_parser_1.BodyParserMiddleware.key]: body_parser_1.BodyParserMiddleware.autoLoadOptions,
    [logging_1.LoggingMiddleware.key]: logging_1.LoggingMiddleware.autoLoadOptions,
    [error_1.ErrorMiddleware.key]: error_1.ErrorMiddleware.autoLoadOptions,
};
//# sourceMappingURL=index.js.map
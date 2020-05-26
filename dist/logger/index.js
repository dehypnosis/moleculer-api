"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoggerConstructors = exports.WinstonLogger = exports.Logger = void 0;
const logger_1 = require("./logger");
Object.defineProperty(exports, "Logger", { enumerable: true, get: function () { return logger_1.Logger; } });
const winston_1 = require("./winston");
Object.defineProperty(exports, "WinstonLogger", { enumerable: true, get: function () { return winston_1.WinstonLogger; } });
exports.LoggerConstructors = {
    [winston_1.WinstonLogger.key]: winston_1.WinstonLogger,
};
//# sourceMappingURL=index.js.map
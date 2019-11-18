"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const logger_1 = require("./logger");
exports.Logger = logger_1.Logger;
const winston_1 = require("./winston");
exports.WinstonLogger = winston_1.WinstonLogger;
exports.LoggerConstructors = {
    [winston_1.WinstonLogger.key]: winston_1.WinstonLogger,
};
//# sourceMappingURL=index.js.map
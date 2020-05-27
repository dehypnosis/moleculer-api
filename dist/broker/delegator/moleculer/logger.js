"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createMoleculerLoggerOptions = void 0;
const logger_1 = require("../../../logger");
function createMoleculerLoggerOptions(logger) {
    if (logger instanceof logger_1.WinstonLogger) {
        const opts = logger.options;
        return {
            type: "Winston",
            options: {
                level: opts.level,
                winston: opts,
            },
        };
    }
    return true;
}
exports.createMoleculerLoggerOptions = createMoleculerLoggerOptions;
//# sourceMappingURL=logger.js.map
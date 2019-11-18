"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const _ = tslib_1.__importStar(require("lodash"));
const kleur = tslib_1.__importStar(require("kleur"));
const Winston = tslib_1.__importStar(require("winston"));
const winston_1 = require("winston");
const util_1 = tslib_1.__importDefault(require("util"));
const logger_1 = require("./logger");
class WinstonLogger extends logger_1.Logger {
    constructor(props, opts, reusableLogger) {
        super(props);
        this.props = props;
        this.opts = _.defaults(opts || {}, WinstonLogger.defaultOptions);
        this.logger = reusableLogger || Winston.createLogger(this.opts);
    }
    get options() {
        return Object.assign(Object.assign({}, this.opts), { defaultMeta: { label: this.props.label } });
    }
    getChild(label, resetLabelPrefix) {
        return new WinstonLogger(Object.assign(Object.assign({}, this.props), { label: resetLabelPrefix ? label : `${this.props.label}/${label}` }), this.opts, this.logger);
    }
    log(method, args) {
        for (const message of args) {
            this.logger[method]({
                label: this.props.label,
                message: typeof message === "string" ? message : WinstonLogger.printObject(message),
            });
        }
    }
    debug(...args) {
        this.log("debug", args);
    }
    error(...args) {
        this.log("error", args);
    }
    info(...args) {
        this.log("info", args);
    }
    warn(...args) {
        this.log("warn", args);
    }
}
exports.WinstonLogger = WinstonLogger;
WinstonLogger.key = "winston";
WinstonLogger.defaultOptions = {
    level: "info",
    silent: false,
    transports: [
        new winston_1.transports.Console({
            format: winston_1.format.combine(winston_1.format.timestamp(), winston_1.format.prettyPrint(), winston_1.format.colorize(), winston_1.format.printf(({ level, message, timestamp, label }) => {
                return `${timestamp} ${level} ${kleur.yellow(label)}: ${message}`;
            })),
        }),
    ],
};
WinstonLogger.printObject = (o) => util_1.default.inspect(o, { showHidden: false, depth: 3, colors: true });
//# sourceMappingURL=winston.js.map
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Reporter = void 0;
const tslib_1 = require("tslib");
const kleur = tslib_1.__importStar(require("kleur"));
const _ = tslib_1.__importStar(require("lodash"));
const os = tslib_1.__importStar(require("os"));
const table_1 = require("table");
const interface_1 = require("../interface");
class Reporter {
    constructor(props, opts) {
        this.props = props;
        this.opts = opts;
        this.gatewayNodeId = os.hostname();
        this.stack = [];
        /* Flush messages */
        this.debouncedFlush = _.debounce(this.flush.bind(this), 1000, { maxWait: 5000 });
        this.opts = _.defaultsDeep(this.opts || {}, {
            tableWidthZoomFactor: 1,
        });
        // adjust report table column size: 0.5 ~ 2, default: 1
        if (!isNaN(this.opts.tableWidthZoomFactor)) {
            this.opts.tableWidthZoomFactor = Math.min(2, Math.max(this.opts.tableWidthZoomFactor, 0.5));
        }
    }
    getChild(props) {
        return new Reporter(Object.assign(Object.assign({}, this.props), { props: props === null ? null : _.defaults(props, this.props.props) }), this.opts);
    }
    flush() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            if (this.stack.length === 0) {
                return;
            }
            const tbl = this.peekTable();
            try {
                yield this.props.send(this.stack.map(report => (Object.assign(Object.assign({}, report), { message: interface_1.removeANSIColor(report.message) }))), tbl);
            }
            catch (error) {
                this.props.logger.info(`failed to deliver report to origin service:\n${tbl}`);
                this.props.logger.error(error);
            }
            this.clear();
        });
    }
    clear() {
        this.stack.splice(0, this.stack.length);
    }
    /* Push messages to stack */
    push(type, message) {
        if (this.props.props !== null) {
            message = _.defaults(typeof message === "object" && message !== null ? message : { original: message }, this.props.props);
        }
        this.stack.push({
            type,
            message,
            at: new Date(),
        });
        process.nextTick(this.debouncedFlush);
    }
    info(message) {
        this.push("info", message);
    }
    debug(message) {
        this.push("debug", message);
    }
    warn(message) {
        this.push("warn", message);
    }
    error(message) {
        let err = message;
        if (!(message instanceof Error)) {
            if (typeof message === "string") {
                err = new Error(message);
            }
            else if (typeof message === "object" && message !== null) {
                err = new Error();
                for (const [key, value] of Object.entries(message)) {
                    Object.defineProperty(err, key, { value });
                }
            }
        }
        this.push("error", err);
    }
    /* Draw message stack as table */
    peekTable() {
        const title = `< ${kleur.bold(kleur.white(`Report from API Gateway`))} ${kleur.dim(kleur.white(`@${this.gatewayNodeId}`))} -> ${this.props.service.toString()} >`;
        return `\n${title}\n` + table_1.table([["type", "message"].map(c => kleur.white(c))].concat(Reporter.reportsToRows(this.stack)), {
            border: table_1.getBorderCharacters("norc"),
            columns: {
                0: { alignment: "left", wrapWord: false },
                1: { alignment: "left", wrapWord: false, width: Math.ceil(80 * this.opts.tableWidthZoomFactor) },
            },
        });
    }
    static getTable(reports) {
        return "\n" + table_1.table([["type", "message"].map(c => kleur.white(c))].concat(Reporter.reportsToRows(reports)), {
            border: table_1.getBorderCharacters("norc"),
            columns: {
                0: { alignment: "left", wrapWord: false },
                1: { alignment: "left", wrapWord: false, width: Math.ceil(80) },
            },
        });
    }
    static reportsToRows(reports) {
        return reports.map(({ message, type, at }) => {
            let content;
            if (typeof message === "string" || typeof message !== "object" || message === null) {
                content = message;
            }
            else if (typeof message === "object") {
                content = peekObject(message);
            }
            return [
                kleur[Reporter.tableTypeLabelColors[type]](kleur.bold(type)),
                content,
            ];
        });
    }
}
exports.Reporter = Reporter;
Reporter.tableTypeLabelColors = {
    info: "green",
    warn: "yellow",
    debug: "white",
    error: "red",
};
/*
* remove stack from error instance
* add field notation for object messages
* rearrange indent multiline texts like GraphQL Schema
*/
const nonPreferedToStrings = [Object.prototype.toString, Array.prototype.toString, Error.prototype.toString];
function peekObject(value, path = "", padEnd = 10, depth = 1) {
    if (typeof value === "object" && value !== null) {
        let stopReading = depth > 4;
        if (stopReading) {
            value = "[...]";
        }
        else {
            if (value.toString && !nonPreferedToStrings.includes(value.toString)) {
                const tempStr = value.toString();
                stopReading = tempStr !== "[object Object]";
                if (stopReading) {
                    padEnd += 4;
                }
            }
            if (!stopReading) {
                return Object.getOwnPropertyNames(value)
                    .filter(key => !(key === "stack" && value instanceof Error))
                    .reduce((items, key) => items.concat(peekObject(value[key], path ? `${path}.${key}` : key, path ? padEnd + 4 : padEnd, depth + 1)), [])
                    .filter(item => !!item)
                    .join("\n");
            }
        }
    }
    if (typeof value === "string") {
        const matches = /^([ \t]+)[^\s]+$/mg.exec(value);
        if (matches) {
            let shortestIndent = "";
            for (const match of matches) {
                const indent = match.split(/[^\s]+/)[0];
                if (!shortestIndent || shortestIndent.length > indent.length) {
                    shortestIndent = indent;
                }
            }
            value = value.trim().split("\n").map((s, i) => (i === 0 ? "" : " ".repeat(padEnd)) + s.replace(shortestIndent, "").trimRight()).join("\n");
        }
        else {
            value = value.trim();
        }
    }
    return path ? kleur.dim(`${path}: `.padEnd(padEnd)) + value : value;
}
//# sourceMappingURL=reporter.js.map
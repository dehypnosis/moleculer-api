"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const vm = tslib_1.__importStar(require("vm"));
const tslib = tslib_1.__importStar(require("tslib"));
const interface_1 = require("../interface");
class DummyConsole {
    constructor(reporter) {
        this.reporter = reporter;
    }
    debug(...messages) {
        this.reporter.debug(messages.length === 1 ? [0] : messages);
    }
    error(...messages) {
        this.reporter.error(messages.length === 1 ? messages[0] : messages);
    }
    info(...messages) {
        this.reporter.info(messages.length === 1 ? messages[0] : messages);
    }
    warn(...messages) {
        this.reporter.warn(messages.length === 1 ? messages[0] : messages);
    }
    trace(...messages) {
        messages.push(new Error().stack);
        this.reporter.info(messages.length === 1 ? messages[0] : messages);
    }
    log(...messages) {
        this.reporter.debug(messages.length === 1 ? messages[0] : messages);
    }
}
function createInlineFunction(props, opts) {
    if (!interface_1.validateInlineFunction(props.function)) {
        throw new Error("not a valid inline function"); // TODO: normalize error
    }
    const script = new vm.Script(`(${props.function})({ ${props.mappableKeys.join(", ")} })`, {
        displayErrors: true,
        timeout: 100,
    });
    const sandbox = Object.assign({ console: new DummyConsole(props.reporter), util: opts && opts.util || {} }, tslib);
    return (args) => {
        const value = script.runInNewContext(Object.assign(Object.assign({}, sandbox), args));
        if (props.returnTypeCheck && !props.returnTypeCheck(value)) {
            const error = new Error("return value of inline function has invalid type"); // TODO: normalize error
            if (props.returnTypeNotation) {
                // @ts-ignore
                error.expected = props.returnTypeNotation;
            }
            // @ts-ignore
            error.actual = typeof value;
            props.reporter.error(error);
            throw error;
        }
        return value;
    };
}
exports.createInlineFunction = createInlineFunction;
//# sourceMappingURL=function.js.map
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Plugin = void 0;
const interface_1 = require("../../interface");
class Plugin extends interface_1.Pluggable {
    constructor(props, opts) {
        super();
        this.props = props;
    }
}
exports.Plugin = Plugin;
//# sourceMappingURL=plugin.js.map
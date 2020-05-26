"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ServerMiddleware = void 0;
const interface_1 = require("../../interface");
class ServerMiddleware extends interface_1.Pluggable {
    constructor(props, opts) {
        super();
        this.props = props;
    }
}
exports.ServerMiddleware = ServerMiddleware;
//# sourceMappingURL=middleware.js.map
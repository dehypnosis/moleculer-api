"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const _ = tslib_1.__importStar(require("lodash"));
const protocol_1 = require("./protocol");
class ServerHTTP2Protocol extends protocol_1.ServerProtocol {
    constructor(props, opts) {
        super(props);
        this.opts = _.defaultsDeep(opts || {}, {});
    }
    // TODO: HTTP2
    start() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            throw new Error("not implemented");
        });
    }
    stop() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            throw new Error("not implemented");
        });
    }
}
exports.ServerHTTP2Protocol = ServerHTTP2Protocol;
ServerHTTP2Protocol.key = "http2";
ServerHTTP2Protocol.autoLoadOptions = false; // disabled as default
//# sourceMappingURL=http2.js.map
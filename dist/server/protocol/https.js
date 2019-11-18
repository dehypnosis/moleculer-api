"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const https = tslib_1.__importStar(require("https"));
const _ = tslib_1.__importStar(require("lodash"));
const protocol_1 = require("./protocol");
class ServerHTTPSProtocol extends protocol_1.ServerProtocol {
    constructor(props, opts) {
        super(props);
        this.opts = _.defaultsDeep(opts || {}, {
            port: 443,
            hostname: "0.0.0.0",
        });
    }
    start(modules) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const _a = this.opts, { port, hostname } = _a, tlsOpts = tslib_1.__rest(_a, ["port", "hostname"]);
            if (!tlsOpts.key || !tlsOpts.cert) {
                throw new Error("cannot run https protocol without key, cert file"); // TODO: normalize error
            }
            // mount http module
            this.server = https.createServer(tlsOpts, modules.http);
            // mount ws module
            this.server.on("upgrade", modules.ws.upgradeEventHandler);
            // listen
            this.server.listen(port, hostname);
            return [
                `https://${hostname}:${port}`,
                `wss://${hostname}:${port}`,
            ];
        });
    }
    stop() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            if (this.server) {
                this.server.close();
            }
        });
    }
}
exports.ServerHTTPSProtocol = ServerHTTPSProtocol;
ServerHTTPSProtocol.key = "https";
ServerHTTPSProtocol.autoLoadOptions = false;
//# sourceMappingURL=https.js.map
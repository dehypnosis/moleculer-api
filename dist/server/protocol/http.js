"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const http = tslib_1.__importStar(require("http"));
const _ = tslib_1.__importStar(require("lodash"));
const protocol_1 = require("./protocol");
class ServerHTTPProtocol extends protocol_1.ServerProtocol {
    constructor(props, opts) {
        super(props);
        this.opts = _.defaultsDeep(opts || {}, ServerHTTPProtocol.autoLoadOptions);
    }
    start(modules) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const { port, hostname } = this.opts;
            // mount http module
            this.server = http.createServer(modules.http);
            // mount ws module
            this.server.on("upgrade", modules.ws.upgradeEventHandler);
            // listen
            this.server.listen(port, hostname);
            return [
                `http://${hostname}:${port}`,
                `ws://${hostname}:${port}`,
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
exports.ServerHTTPProtocol = ServerHTTPProtocol;
ServerHTTPProtocol.key = "http";
ServerHTTPProtocol.autoLoadOptions = {
    port: 8080,
    hostname: "0.0.0.0",
};
//# sourceMappingURL=http.js.map
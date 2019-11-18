"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const http_1 = require("./http");
const http2_1 = require("./http2");
const https_1 = require("./https");
const protocol_1 = require("./protocol");
exports.ServerProtocol = protocol_1.ServerProtocol;
exports.ServerProtocolConstructors = {
    [http_1.ServerHTTPProtocol.key]: http_1.ServerHTTPProtocol,
    [https_1.ServerHTTPSProtocol.key]: https_1.ServerHTTPSProtocol,
    [http2_1.ServerHTTP2Protocol.key]: http2_1.ServerHTTP2Protocol,
};
exports.defaultServerProtocolConstructorOptions = {
    [http_1.ServerHTTPProtocol.key]: http_1.ServerHTTPProtocol.autoLoadOptions,
    [https_1.ServerHTTPSProtocol.key]: https_1.ServerHTTPSProtocol.autoLoadOptions,
    [http2_1.ServerHTTP2Protocol.key]: http2_1.ServerHTTP2Protocol.autoLoadOptions,
};
//# sourceMappingURL=index.js.map
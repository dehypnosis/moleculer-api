"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const stream_1 = require("stream");
function createStreamFromWebSocket(socket, opts = {}) {
    const write = (chunk, enc, cb) => {
        if (socket.readyState === socket.OPEN) {
            socket.send(chunk, cb);
        }
        else {
            // @ts-ignore
            socket.once("open", ignore => write(chunk, enc, cb));
        }
    };
    const stream = new stream_1.Duplex(Object.assign({ read: size => { }, write, final: cb => cb() }, opts));
    socket.on("message", chunk => stream.push(chunk));
    return stream;
}
exports.createStreamFromWebSocket = createStreamFromWebSocket;
//# sourceMappingURL=stream.js.map
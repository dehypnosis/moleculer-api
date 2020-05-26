"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isDuplexStream = exports.isReadStream = exports.isWriteStream = exports.isStream = void 0;
function isStream(stream) {
    return stream !== null &&
        typeof stream === "object" &&
        typeof stream.pipe === "function";
}
exports.isStream = isStream;
function isWriteStream(stream) {
    return isStream(stream) &&
        stream.writable !== false &&
        typeof stream._write === "function" &&
        typeof stream._writableState === "object";
}
exports.isWriteStream = isWriteStream;
function isReadStream(stream) {
    return isStream(stream) &&
        stream.readable !== false &&
        typeof stream._read === "function" &&
        typeof stream._readableState === "object";
}
exports.isReadStream = isReadStream;
function isDuplexStream(stream) {
    return isWriteStream(stream) &&
        isReadStream(stream);
}
exports.isDuplexStream = isDuplexStream;
//# sourceMappingURL=stream.js.map
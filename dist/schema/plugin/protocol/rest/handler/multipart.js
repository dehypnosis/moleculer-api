"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MultipartFormDataHandler = void 0;
const tslib_1 = require("tslib");
const busboy_1 = tslib_1.__importDefault(require("busboy"));
const fs_capacitor_1 = require("fs-capacitor");
// ref: https://github.com/jaydenseric/graphql-upload/blob/master/src/processRequest.mjs
class MultipartFormDataHandler {
    constructor(props) {
        this.props = props;
    }
    collect(req, res) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            if (req.method !== "POST") {
                return {};
            }
            const contentType = req.header("content-type");
            if (!contentType || !contentType.toLowerCase().startsWith("multipart/form-data")) {
                return {};
            }
            return new Promise((resolve, reject) => {
                let released = false;
                let exitError;
                let currentStream;
                const parser = new busboy_1.default({
                    headers: req.headers,
                    defCharset: "utf8",
                    limits: {
                        fileSize: this.props.maxFileSize,
                        files: this.props.maxFiles,
                    },
                });
                const uploads = {};
                const capacitors = {};
                const release = () => {
                    if (released) {
                        return;
                    }
                    released = true;
                    for (const capacitor of Object.values(capacitors)) {
                        capacitor.destroy ? capacitor.destroy(exitError) : capacitor.end();
                    }
                };
                const exit = (error) => {
                    if (exitError) {
                        return;
                    }
                    exitError = error;
                    // resume handler
                    reject(error);
                    // destroy parser
                    // @ts-ignore
                    parser.destroy ? parser.destroy() : parser.end();
                    // destroy currently processing file stream
                    if (currentStream) {
                        // @ts-ignore
                        currentStream.destroy ? currentStream.destroy(error) : currentStream.resume();
                    }
                    // release fs buffer streams
                    release();
                    // resume request
                    req.unpipe(parser);
                    setImmediate(() => req.resume());
                };
                // collect file stream and create fs buffer streams
                parser.on("file", (fieldname, stream, filename, encoding, mimetype) => {
                    if (exitError) {
                        this.wasteStream(stream);
                        return;
                    }
                    currentStream = stream;
                    stream.on("end", () => {
                        currentStream = undefined;
                    });
                    // create buffer stream
                    const capacitor = new fs_capacitor_1.WriteStream();
                    capacitor.on("error", () => {
                        stream.unpipe();
                        stream.resume();
                    });
                    stream.on("error", error => {
                        stream.unpipe();
                        capacitor.destroy(error);
                    });
                    stream.on("limit", () => {
                        stream.unpipe();
                        capacitor.destroy(new Error(`file ${filename} exceeds the ${this.props.maxFileSize} byte size limit`)); // TODO: normalize error
                    });
                    stream.pipe(capacitor);
                    const upload = {
                        filename,
                        encoding,
                        mimetype,
                        createReadStream() {
                            // @ts-ignore
                            const error = capacitor.error || (released ? exitError : undefined);
                            if (error) {
                                throw error;
                            }
                            return capacitor.createReadStream();
                        },
                    };
                    // store to map
                    uploads[fieldname] = upload;
                    capacitors[fieldname] = capacitor;
                });
                /* parser event handling */
                parser.once("filesLimit", () => {
                    exit(new Error(`max file uploads exceeded`)); // TODO: normalize error
                });
                parser.once("error", exit);
                parser.once("finish", () => {
                    req.unpipe(parser);
                    req.resume();
                    // process request handling
                    resolve(uploads);
                });
                /* request/response event handling */
                res.once("finish", release); // after response ends, clear fs buffers
                res.once("close", release);
                const abort = () => {
                    exit(new Error("request disconnected during file upload stream parsing.")); // TODO: normalize error
                };
                req.once("close", abort);
                req.once("end", () => req.removeListener("close", abort));
                // start parsing!
                req.pipe(parser);
            });
        });
    }
    wasteStream(stream) {
        stream.on("error", () => {
        });
        stream.resume();
    }
}
exports.MultipartFormDataHandler = MultipartFormDataHandler;
//# sourceMappingURL=multipart.js.map
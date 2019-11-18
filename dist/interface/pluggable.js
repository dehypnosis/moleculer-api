"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const keyed_1 = require("./keyed");
class Pluggable extends keyed_1.HasStaticKey {
    constructor() {
        super();
        const constructor = this.constructor;
        if (typeof constructor.autoLoadOptions === "undefined") {
            throw new Error(`${constructor.name}.autoLoadOptions public static field required`);
        }
    }
}
exports.Pluggable = Pluggable;
//# sourceMappingURL=pluggable.js.map
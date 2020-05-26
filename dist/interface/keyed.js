"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HasStaticKey = void 0;
const tslib_1 = require("tslib");
const kleur = tslib_1.__importStar(require("kleur"));
class HasStaticKey {
    constructor() {
        const constructor = this.constructor;
        if (typeof constructor.key === "undefined") {
            throw new Error(`${constructor.name}.key public static field required`);
        }
        this.key = constructor.key;
    }
    toString() {
        return kleur.yellow(this.key);
    }
}
exports.HasStaticKey = HasStaticKey;
//# sourceMappingURL=keyed.js.map
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const object_hash_1 = tslib_1.__importDefault(require("object-hash"));
function hashObject(v, respectArrayOrders = false) {
    return object_hash_1.default(v, {
        algorithm: "md5",
        unorderedArrays: !respectArrayOrders,
        unorderedObjects: true,
        unorderedSets: true,
    });
}
exports.hashObject = hashObject;
//# sourceMappingURL=hash.js.map
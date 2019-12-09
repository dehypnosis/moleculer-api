"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
const moduleName = process.argv[2] || "moleculer";
process.argv.splice(2, 1);
Promise.resolve().then(() => __importStar(require("./" + moduleName)));
//# sourceMappingURL=index.js.map
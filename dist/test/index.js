"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetch = void 0;
const tslib_1 = require("tslib");
tslib_1.__exportStar(require("./util"), exports);
tslib_1.__exportStar(require("./moleculer"), exports);
const node_fetch_1 = tslib_1.__importDefault(require("node-fetch"));
exports.fetch = node_fetch_1.default;
//# sourceMappingURL=index.js.map
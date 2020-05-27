"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ServerApplicationComponentConstructors = void 0;
const tslib_1 = require("tslib");
const component_1 = require("./http/component");
const component_2 = require("./ws/component");
var component_3 = require("./component");
Object.defineProperty(exports, "ServerApplicationComponent", { enumerable: true, get: function () { return component_3.ServerApplicationComponent; } });
tslib_1.__exportStar(require("./route"), exports);
tslib_1.__exportStar(require("./http/route"), exports);
tslib_1.__exportStar(require("./ws/route"), exports);
exports.ServerApplicationComponentConstructors = {
    [component_1.ServerHTTPApplication.key]: component_1.ServerHTTPApplication,
    [component_2.ServerWebSocketApplication.key]: component_2.ServerWebSocketApplication,
};
//# sourceMappingURL=index.js.map
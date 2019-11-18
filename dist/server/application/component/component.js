"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const kleur = tslib_1.__importStar(require("kleur"));
const interface_1 = require("../../../interface");
class ServerApplicationComponent extends interface_1.HasStaticKey {
    constructor(props, opts) {
        super();
        this.props = props;
    }
    toString() {
        return kleur.yellow(`${this.key}<${this.Route.name}>`);
    }
    canHandleRoute(route) {
        return route instanceof this.Route;
    }
}
exports.ServerApplicationComponent = ServerApplicationComponent;
//# sourceMappingURL=component.js.map
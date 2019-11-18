"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const kleur = tslib_1.__importStar(require("kleur"));
const route_1 = require("../route");
class HTTPRoute extends route_1.Route {
    constructor(props) {
        const propsWithProtocol = Object.assign(Object.assign({}, props), { protocol: "http" });
        super(propsWithProtocol);
        this.props = propsWithProtocol;
    }
    get method() {
        return this.props.method;
    }
    get handler() {
        return this.props.handler;
    }
    isConflict(route) {
        return route instanceof HTTPRoute && route.method === this.method && super.isConflict(route);
    }
    toString() {
        return kleur.cyan(`${this.path} (${this.protocol}:${this.method})${this.props.description ? ": " + kleur.dim(this.props.description) : ""}`);
    }
}
exports.HTTPRoute = HTTPRoute;
//# sourceMappingURL=route.js.map
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebSocketRoute = void 0;
const route_1 = require("../route");
class WebSocketRoute extends route_1.Route {
    constructor(props) {
        const propsWithProtocol = Object.assign(Object.assign({}, props), { protocol: "ws" });
        super(propsWithProtocol);
        this.props = propsWithProtocol;
    }
    get handler() {
        return this.props.handler;
    }
    isConflict(route) {
        return route instanceof WebSocketRoute && super.isConflict(route);
    }
}
exports.WebSocketRoute = WebSocketRoute;
//# sourceMappingURL=route.js.map
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const kleur = tslib_1.__importStar(require("kleur"));
class ServiceNode {
    constructor(props) {
        this.props = props;
    }
    get id() {
        return this.props.id;
    }
    get displayName() {
        return this.props.displayName;
    }
    get meta() {
        return this.props.meta;
    }
    toString() {
        return kleur.green(this.props.id);
    }
}
exports.ServiceNode = ServiceNode;
//# sourceMappingURL=node.js.map
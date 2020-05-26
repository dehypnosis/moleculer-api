"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ServiceAction = void 0;
const tslib_1 = require("tslib");
const kleur = tslib_1.__importStar(require("kleur"));
const interface_1 = require("../../interface");
class ServiceAction {
    constructor(props) {
        this.props = props;
        this.examples = [];
        this.paramsSchema = null;
        if (this.props.paramsSchema) {
            this.paramsSchema = interface_1.normalizeValidationSchema(this.props.paramsSchema);
        }
    }
    toString() {
        return kleur.blue(this.props.id);
    }
    get id() {
        return this.props.id;
    }
    get displayName() {
        return this.props.displayName;
    }
    get service() {
        return this.props.service;
    }
    get description() {
        return this.props.description;
    }
    get deprecated() {
        return this.props.deprecated;
    }
    get cachePolicy() {
        return this.props.cachePolicy;
    }
    get meta() {
        return this.props.meta;
    }
    addExample(example, limit) {
        example.hash = interface_1.hashObject(example);
        if (this.examples.some(eg => eg.hash === example.hash)) {
            return;
        }
        this.examples.unshift(example);
        this.examples.splice(limit);
    }
    getExamples(limit) {
        return this.examples.slice(0, limit);
    }
}
exports.ServiceAction = ServiceAction;
//# sourceMappingURL=action.js.map
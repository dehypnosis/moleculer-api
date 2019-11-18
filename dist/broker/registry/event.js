"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const kleur = tslib_1.__importStar(require("kleur"));
const interface_1 = require("../../interface");
class ServiceEvent {
    constructor(props) {
        this.props = props;
        this.examples = [];
    }
    get service() {
        return this.props.service;
    }
    get id() {
        return this.props.id;
    }
    get displayName() {
        return this.props.displayName;
    }
    get group() {
        return this.props.group;
    }
    get description() {
        return this.props.description;
    }
    get deprecated() {
        return this.props.deprecated;
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
    toString() {
        return kleur.green(this.props.id);
    }
}
exports.ServiceEvent = ServiceEvent;
//# sourceMappingURL=event.js.map
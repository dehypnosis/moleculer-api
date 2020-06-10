"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConnectorValidator = void 0;
const interface_1 = require("../../../interface");
/* common validation schema */
const map = {
    type: "custom",
    optional: true,
    check(value) {
        if (interface_1.validateInlineFunction(value)) {
            return true;
        }
        return [{
                type: "invalidFunctionString",
                expected: "JavaScriptFunctionString",
                actual: value,
                message: "MapConnectorSchema should be a string which denotes a JavaScript function",
            }];
    },
};
const requiredMap = Object.assign(Object.assign({}, map), { optional: false });
const params = [
    {
        type: "object",
        strict: false,
    },
    {
        type: "string",
    },
];
exports.ConnectorValidator = {
    call: {
        type: "object",
        strict: true,
        props: {
            action: {
                type: "string",
            },
            implicitParams: {
                type: "boolean",
                default: true,
                optional: true,
            },
            params,
            if: map,
            map,
        },
    },
    publish: {
        type: "object",
        strict: true,
        props: {
            event: [
                { type: "string" },
                requiredMap,
            ],
            params,
            groups: {
                type: "array",
                optional: true,
                empty: false,
                items: {
                    type: "string",
                },
            },
            broadcast: {
                type: "boolean",
                optional: true,
            },
            filter: map,
            map,
        },
    },
    subscribe: {
        type: "object",
        strict: true,
        props: {
            events: [
                {
                    type: "array",
                    empty: false,
                    items: {
                        type: "string",
                    },
                },
                requiredMap,
            ],
            filter: map,
            map,
        },
    },
    map: requiredMap,
    params,
};
//# sourceMappingURL=validator.js.map
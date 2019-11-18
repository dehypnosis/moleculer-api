"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// TODO: Catalog for each connectors scheme....
exports.ConnectorDescriber = {
    call(schema) {
        return {
            type: "call",
            map: null,
            status: () => ({ message: "TODO", code: 123, updatedAt: new Date() }),
            policies: [],
            action: "test",
            params: {},
        };
    },
};
//# sourceMappingURL=describer.js.map
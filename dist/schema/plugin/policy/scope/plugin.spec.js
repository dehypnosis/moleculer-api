"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const test_1 = require("../../../../test");
const plugin_1 = require("./plugin");
describe("Filter policy schema validation test", () => {
    const plugin = new plugin_1.ScopePolicyPlugin({
        logger: test_1.getLogger(),
    });
    it("valid schema should be return true", () => {
        return expect(plugin.validateSchema(["any", "scope", "here"])).toMatchObject([]);
    });
    it("invalid schema should be return errors", () => {
        return expect(plugin.validateSchema("12345")).toMatchObject(expect.arrayContaining([
            expect.objectContaining({
                type: "array",
            }),
        ]));
    });
});
//# sourceMappingURL=plugin.spec.js.map
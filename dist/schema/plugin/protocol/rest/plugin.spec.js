"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const test_1 = require("../../../../test");
const plugin_1 = require("./plugin");
describe("REST schema validation test", () => {
    const plugin = new plugin_1.RESTProtocolPlugin({
        logger: test_1.getLogger(),
        policyPlugins: [],
    });
    it("valid schema should be return true", () => {
        return expect(plugin.validateSchema({
            description: "..",
            basePath: "/players",
            routes: [
                {
                    method: "GET",
                    path: "/test",
                    description: "",
                    deprecated: false,
                    call: {
                        params: {},
                        action: "",
                    },
                    ignoreError: true,
                },
                {
                    method: "POST",
                    path: "/test",
                    description: "",
                    deprecated: false,
                    publish: {
                        event: "",
                        params: {},
                    },
                },
                {
                    method: "GET",
                    path: "/test3",
                    description: "",
                    deprecated: false,
                    map: "({ params, response }) => ({ response, params})",
                },
            ],
        })).toMatchObject([]);
    });
});
//# sourceMappingURL=plugin.spec.js.map
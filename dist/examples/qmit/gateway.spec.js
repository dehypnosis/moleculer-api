"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const gateway_1 = require("./gateway");
jest.setTimeout(5 * 1000);
describe("Test 'gateway'", () => {
    afterAll(() => gateway_1.gateway.stop());
    describe("Simple working test", () => {
        it("started well", () => {
            return expect(gateway_1.gateway.start()).resolves.not.toThrow();
        });
    });
});
//# sourceMappingURL=gateway.spec.js.map
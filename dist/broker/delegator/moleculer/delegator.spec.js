"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const test_1 = require("../../../test");
describe("moleculer service broker test", () => {
    const broker = test_1.getServiceBroker({
        delegator: {
            moleculer: {
                transporter: "TCP",
            },
        },
    });
    const mocks = {
        connected: jest.fn(),
        disconnected: jest.fn(),
        nodePoolUpdated: jest.fn(),
    };
    beforeAll(() => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
        yield broker.start(mocks);
    }));
    it("broker can health check subscription", () => {
        return expect(broker.healthCheckSubscribe()).resolves.toMatchObject({ code: 200 });
    });
    it("broker should not discovered anything yet", () => {
        expect(mocks.connected).not.toHaveBeenCalled();
        expect(mocks.disconnected).not.toHaveBeenCalled();
        expect(mocks.nodePoolUpdated).not.toHaveBeenCalled();
    });
    afterAll(() => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
        yield broker.stop();
    }));
});
//# sourceMappingURL=delegator.spec.js.map
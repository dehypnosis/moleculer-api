"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const test_1 = require("../../test");
const schema = test_1.getSchemaRegistry();
describe("Schema registry start", () => {
    const mock = jest.fn().mockName("listeners.updated.master");
    beforeAll(() => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
        yield schema.start({
            updated: branch => {
                if (branch.isMaster) {
                    mock();
                }
            },
            removed: jest.fn(),
        });
        yield test_1.sleep(1);
    }));
    it("master branch should have been updated twice on start", () => {
        expect(mock).toBeCalledTimes(2); // created + initially compiled
    });
    afterAll(() => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
        yield schema.stop();
    }));
});
//# sourceMappingURL=schema.branch.init.spec.js.map
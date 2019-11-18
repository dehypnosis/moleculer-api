"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const iterable_1 = require("./iterable");
function range(a = 0, b = 5, sleepModifier = 1) {
    return tslib_1.__asyncGenerator(this, arguments, function* range_1() {
        for (let i = a; i < b; i++) {
            yield tslib_1.__await(new Promise(resolve => setTimeout(resolve, Math.random() * 1000 * sleepModifier)));
            yield yield tslib_1.__await(i);
        }
    });
}
describe("composeAsyncIterators should works", () => {
    const results = [];
    beforeAll(() => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
        const iterator = iterable_1.composeAsyncIterators([
            {
                iterator: range(0, 5, 0),
                filter: x => x % 2 === 0,
                map: x => x * 10,
            },
            {
                iterator: range(1, 6, 1),
                filter: x => x % 2 === 1,
                map: x => x * 100,
            },
        ]);
        while (true) {
            const { done, value } = yield iterator.next();
            if (done)
                return;
            results.push(value);
        }
    }));
    it("merge, filter, map should works", () => {
        expect(results).toMatchObject([0, 20, 40, 100, 300, 500]);
    });
});
//# sourceMappingURL=iterable.spec.js.map
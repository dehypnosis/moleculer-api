"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const http = tslib_1.__importStar(require("http"));
const test_1 = require("../../../../test");
const context_1 = require("../../context");
const component_1 = require("./component");
const route_1 = require("./route");
const httpApp = new component_1.ServerHTTPApplication({
    logger: test_1.getLogger({ level: "error" }),
});
const httpServer = http.createServer(httpApp.module);
beforeAll(() => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
    yield httpApp.start();
    httpServer.listen(8889);
}));
describe("http application should work with routes", () => {
    const createContext = jest.fn(context_1.APIRequestContext.createConstructor([]));
    const message = { data: Math.random() * 1000 };
    httpApp.mountRoutes([
        new route_1.HTTPRoute({
            method: "GET",
            path: "/data",
            description: null,
            handler: (context, req, res) => {
                res.json(message);
            },
        }),
    ], ["/", "/~dev"], createContext);
    it("httpClient should got proper response", () => {
        return expect(test_1.fetch("http://localhost:8889/data", { method: "GET" }).then(res => res.json()))
            .resolves.toMatchObject(message);
    });
    it("httpClient should mount all given prefixes", () => {
        return expect(test_1.fetch("http://localhost:8889/~dev/data", { method: "GET" }).then(res => res.json()))
            .resolves.toMatchObject(message);
    });
    it("createContext should have been called twice", () => {
        expect(createContext).toBeCalledTimes(2);
    });
});
afterAll(() => {
    httpServer.close();
});
//# sourceMappingURL=component.spec.js.map
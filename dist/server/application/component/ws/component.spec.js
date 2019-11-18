"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const http_1 = tslib_1.__importDefault(require("http"));
const ws_1 = tslib_1.__importDefault(require("ws"));
const test_1 = require("../../../../test");
const context_1 = require("../../context");
const component_1 = require("./component");
const route_1 = require("./route");
const wsApp = new component_1.ServerWebSocketApplication({
    logger: test_1.getLogger(),
});
const httpServer = http_1.default.createServer()
    .on("upgrade", wsApp.module.upgradeEventHandler);
beforeAll(() => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
    yield wsApp.start();
    httpServer.listen(8888);
}));
describe("websocket application should work with routes", () => {
    const mocks = {
        open: jest.fn(),
        message: jest.fn(),
        close: jest.fn(),
        createContext: jest.fn(context_1.APIRequestContext.createConstructor([], {
            after: (source, context) => {
                // @ts-ignore
                context.dummy = 12345;
            },
        })),
    };
    let createdContext;
    const message = JSON.stringify({ data: Math.random() * 1000 });
    wsApp.mountRoutes([
        new route_1.WebSocketRoute({
            path: "/chat",
            description: null,
            handler: (context, socket, req) => {
                createdContext = context;
                socket.send(message, err => err && console.error(err));
                socket.close();
            },
        }),
    ], ["/", "/~master"], mocks.createContext);
    const wsClient = new ws_1.default("ws://localhost:8888/chat");
    wsClient.once("open", mocks.open);
    wsClient.once("message", mocks.message);
    wsClient.once("close", mocks.close);
    const wsClient2 = new ws_1.default("ws://localhost:8888/~master/chat");
    wsClient2.once("open", mocks.open);
    wsClient2.once("message", mocks.message);
    wsClient2.once("close", mocks.close);
    beforeAll(() => test_1.sleep(1));
    it("context should be created as constructor description", () => expect(createdContext).toHaveProperty("dummy", 12345));
    it("handler should have been called twice", () => {
        expect(mocks.createContext).toBeCalledTimes(2);
    });
    it("wsClient should be open for all prefixes", () => {
        expect(mocks.open).toHaveBeenCalledTimes(2);
    });
    it("wsClient should get message from defined route handler", () => {
        expect(mocks.close).toHaveBeenCalledTimes(2);
        expect(mocks.message).toHaveBeenCalledWith(message);
    });
    it("wsClient could be closed from server", () => {
        expect(mocks.close).toHaveBeenCalledTimes(2);
    });
});
afterAll(() => {
    httpServer.close();
});
//# sourceMappingURL=component.spec.js.map
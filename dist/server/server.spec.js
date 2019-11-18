"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const test_1 = require("../test");
const ws_1 = tslib_1.__importDefault(require("ws"));
const moleculer = {
    namespace: "test-server-init",
    transporter: {
        type: "TCP",
        options: {
            udpPeriod: 1,
        },
    },
};
const server = test_1.getAPIServer({
    logger: { level: "error", label: "server" },
    schema: test_1.getSchemaRegistry({
        logger: { level: "error", label: "schema" },
        delegator: { moleculer: Object.assign(Object.assign({}, moleculer), { nodeID: "gateway" }) },
    }),
    opts: {
        update: {
            debouncedSeconds: 0,
        },
        protocol: {
            http: {
                hostname: "localhost",
                port: 8080,
            },
        },
    },
});
const serverWrong = test_1.getAPIServer({
    logger: { level: "error", label: "server-wrong" },
    schema: test_1.getSchemaRegistry({
        logger: { level: "error", label: "schema-wrong" },
        delegator: { moleculer: Object.assign(Object.assign({}, moleculer), { nodeID: "gateway-wrong" }) },
        opts: {
            protocol: {
                GraphQL: {
                    typeDefs: `.Error.Syntax. asdlasd;las `,
                },
            },
        },
    }),
    opts: {
        update: {
            debouncedSeconds: 0,
        },
        protocol: {
            http: {
                port: 8880,
            },
            http2: false,
        },
    },
});
describe("API Server should compile before start", () => {
    it("should failed with wrong plugin options", () => {
        return expect(serverWrong.start()).rejects.toThrowError();
    });
});
describe("API Server should listen in given protocol", () => {
    let hash;
    beforeAll(() => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
        yield server.start();
        // @ts-ignore
        hash = server.props.schema.getBranch("master").latestVersion.shortHash;
    }));
    it("check http protocol", () => {
        return expect(test_1.fetch("http://localhost:8080/graphql", { method: "GET" })
            .then(res => res.text())
            .then(text => {
            // console.log(text);
            return text;
        }))
            .resolves.toBeTruthy();
    });
    it("check http protocol with branch", () => {
        return expect(test_1.fetch("http://localhost:8080/~master/graphql", { method: "GET" })
            .then(res => res.text())
            .then(text => {
            // console.log(text);
            return text;
        }))
            .resolves.toBeTruthy();
    });
    it("check http protocol with version", () => {
        return expect(test_1.fetch(`http://localhost:8080/~master@${hash}/graphql`, { method: "GET" })
            .then(res => res.text())
            .then(text => {
            // console.log(text);
            return text;
        }))
            .resolves.toBeTruthy();
    });
    it("check ws protocol", () => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
        const wsClient = new ws_1.default("ws://localhost:8080/graphql");
        const mock = jest.fn();
        wsClient.once("open", mock);
        yield test_1.sleep(1);
        return expect(mock).toHaveBeenCalled();
    }));
    it("check ws protocol with branch", () => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
        const wsClient = new ws_1.default("ws://localhost:8080/~master/graphql");
        const mock = jest.fn();
        wsClient.once("open", mock);
        yield test_1.sleep(1);
        return expect(mock).toHaveBeenCalled();
    }));
    it("check ws protocol with version", () => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
        const wsClient = new ws_1.default(`ws://localhost:8080/~master@${hash}/graphql`);
        const mock = jest.fn();
        wsClient.once("open", mock);
        yield test_1.sleep(1);
        return expect(mock).toHaveBeenCalled();
    }));
});
afterAll(() => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
    yield server.stop();
    yield serverWrong.stop();
}));
//# sourceMappingURL=server.spec.js.map
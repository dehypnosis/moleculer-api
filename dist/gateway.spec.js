"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const test_1 = require("./test");
const gateway_1 = require("./gateway");
const getOptions = (port) => ({
    brokers: [
        {
            moleculer: {
                namespace: "test-gateway",
                transporter: {
                    type: "TCP",
                    options: {
                        udpPeriod: 1,
                    },
                },
            },
        },
    ],
    schema: {
        protocol: {},
    },
    server: {
        update: {
            debouncedSeconds: 0,
        },
        protocol: {
            http: {
                port,
            },
        },
    },
    logger: {
        winston: { level: "error" },
    },
});
describe("Gateway should listen in given protocol", () => {
    const gateway = new gateway_1.APIGateway(getOptions(38887));
    beforeAll(() => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
        yield gateway.start();
    }));
    it("check http protocol", () => {
        return expect(test_1.fetch("http://localhost:38887/graphql", { method: "GET" })
            .then(res => res.text())
            .then(text => {
            // console.log(text);
            return text;
        }))
            .resolves.toBeTruthy();
    });
    afterAll(() => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
        yield gateway.stop();
    }));
});
describe("Gateway should gracefully shutdown", () => {
    gateway_1.APIGateway.ShutdownSignals.forEach((SIGNAL, i) => {
        const port = 38887 + i;
        const gateway = new gateway_1.APIGateway(getOptions(port));
        beforeAll(() => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
            yield gateway.start();
        }));
        it(`${SIGNAL} signal`, () => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
            process.emit(SIGNAL, SIGNAL);
            yield test_1.sleep(1);
            return expect(test_1.fetch(`http://localhost:${port}/graphql`, { method: "GET" })
                .then(res => res.text())
                .then(text => {
                // console.log(text);
                return text;
            }))
                .rejects.toThrowError();
        }));
        afterAll(() => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
            yield gateway.stop();
        }));
    });
});
//# sourceMappingURL=gateway.spec.js.map
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const test_1 = require("../../test");
const moleculer = {
    namespace: "test-schema-branch-update-1",
    transporter: {
        type: "TCP",
        options: {
            udpPeriod: 1,
        },
    },
};
const schema = test_1.getSchemaRegistry({
    logger: { level: "error", label: "gateway" },
    delegator: { moleculer: Object.assign(Object.assign({}, moleculer), { nodeID: "gateway" }) },
});
/* noted: moleculer TCP transporter not work between brokers with same nodeID */
const remote1 = test_1.getMoleculerServiceBroker({
    logger: { level: "error", label: "remote" },
    moleculer: Object.assign(Object.assign({}, moleculer), { nodeID: "remote" }),
    services: [
        test_1.MoleculerServiceSchemaFactory.echo("master", "master-a"),
        test_1.MoleculerServiceSchemaFactory.echo("master", "master-b"),
        test_1.MoleculerServiceSchemaFactory.echo("master", "master-c"),
        test_1.MoleculerServiceSchemaFactory.echo("master", "conflict-a"),
    ],
});
const remote2 = test_1.getMoleculerServiceBroker({
    logger: { level: "error", label: "remote2" },
    moleculer: Object.assign(Object.assign({}, moleculer), { nodeID: "remote2" }),
    services: [
        test_1.MoleculerServiceSchemaFactory.echo(null, "non-branched"),
        test_1.MoleculerServiceSchemaFactory.echo("dev", "conflict-a", {
            protocol: {
                REST: {
                    routes: [
                        {
                            method: "POST",
                            path: "/blablabla",
                            description: "blablabla test",
                            call: {
                                action: "fofofo.bobobo",
                                params: {},
                            },
                        },
                        {
                            method: "GET",
                            path: "/blublublu",
                            description: "blublublu test",
                            call: {
                                action: "fufufu.bububu",
                                params: {},
                            },
                        },
                    ],
                },
            },
        }),
        test_1.MoleculerServiceSchemaFactory.echo("dev", "dev-a"),
    ],
});
jest.setTimeout(1000 * 20);
const mocks = {
    master: jest.fn().mockName("listeners.updated.master"),
    dev: jest.fn().mockName("listeners.updated.dev"),
};
beforeAll(() => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
    yield Promise.all([
        remote1.start(),
        remote2.start(),
        schema.start({
            updated: branch => mocks[branch.name](),
            removed: jest.fn(),
        }),
    ]);
    yield test_1.sleepUntil(() => {
        const dev = schema.getBranch("dev");
        return dev && dev.services.length >= 7 || false;
    });
}));
describe("Schema registry update", () => {
    it("master branch should gathered master/non-branched services", () => {
        const serviceIds = schema.getBranch("master").services.map(s => s.id);
        expect(serviceIds).toEqual(expect.arrayContaining([
            "master-a", "master-b", "master-c",
            "conflict-a", "non-branched",
        ]));
        expect(serviceIds).toHaveLength(5);
    });
    it("dev should gathered master/dev/non-branched services", () => {
        const serviceIds = schema.getBranch("dev").services.map(s => s.id);
        expect(serviceIds)
            .toEqual(expect.arrayContaining([
            "master-a", "master-b", "master-c",
            "conflict-a", "conflict-a", "non-branched", "dev-a",
        ]));
        expect(serviceIds).toHaveLength(7);
    });
    it("master branch should have 4 route by 6 updates", () => {
        expect(mocks.master).toBeCalledTimes(6); // created +initial compile +a +b +c +conflict-a/master
        expect(schema.getBranch("master").latestVersion.routes).toHaveLength(8); // a,b,c, conflict-a/master = 1 + graphql(3) + introspection
    });
    it("dev branch should have 5 route by at least 3 updates (prefer dev branch)", () => {
        expect(mocks.dev.mock.calls.length).toBeGreaterThanOrEqual(3); // min: forked(+a +b +c +conflict-a/master) +dev-a +conflict-a/dev
        expect(mocks.dev.mock.calls.length).toBeLessThanOrEqual(8); // max: forked() +a +b +c +conflict-a/master +dev-a +conflict-a/dev
        const routes = schema.getBranch("dev").latestVersion.routes;
        expect(routes).toEqual(expect.arrayContaining([
            expect.objectContaining({
                method: "POST",
                path: "/conflict-a/blablabla",
            }),
            expect.objectContaining({
                method: "GET",
                path: "/conflict-a/blublublu",
            }),
        ]));
        expect(routes).toHaveLength(10); // a,b,c, conflict-a/dev = 2, dev-a + graphql(3) + introspection
    });
});
afterAll(() => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
    yield Promise.all([
        schema.stop(),
        remote1.stop(),
        remote2.stop(),
    ]);
}));
//# sourceMappingURL=schema.branch.update.spec.js.map
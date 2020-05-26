"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const test_1 = require("../../test");
const moleculer = {
    namespace: "test-schema-branch-retry-2",
    transporter: {
        type: "TCP",
        options: {
            udpPeriod: 1,
        },
    },
};
const schema = test_1.getSchemaRegistry({
    logger: {
        level: "error",
        label: "gateway",
        silent: true,
    },
    delegator: { moleculer: Object.assign(Object.assign({}, moleculer), { nodeID: "gateway" }) },
});
const remoteWrong = test_1.getMoleculerServiceBroker({
    logger: { level: "error", label: "remote-wrong" },
    moleculer: Object.assign(Object.assign({}, moleculer), { nodeID: "remote-wrong" }),
    services: [
        test_1.MoleculerServiceSchemaFactory.echo("master", "master-c", {
            protocol: {
                GraphQL: {
                    typeDefs: `
            type Foo {
              foo: WrongTypeReference!
            }
          `,
                    resolvers: {
                        Query: {},
                    },
                },
            },
        }),
    ],
});
const remote = test_1.getMoleculerServiceBroker({
    logger: { level: "error", label: "remote" },
    moleculer: Object.assign(Object.assign({}, moleculer), { nodeID: "remote" }),
    services: [
        test_1.MoleculerServiceSchemaFactory.echo("master", "master-b", {
            protocol: {
                GraphQL: {
                    typeDefs: `
            type Bar {
              foo: EarlyTypeReference!
            }
          `,
                    resolvers: {
                        Query: {},
                    },
                },
            },
        }),
        test_1.MoleculerServiceSchemaFactory.echo("master", "master-a", {
            protocol: {
                GraphQL: {
                    typeDefs: `
            type EarlyTypeReference {
              foo: String!
            }
          `,
                    resolvers: {
                        Query: {},
                    },
                },
            },
        }),
    ],
});
jest.setTimeout(1000 * 20);
const schemaUpdated = jest.fn().mockName("listeners.updated.master");
beforeAll(() => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
    yield Promise.all([
        remoteWrong.start(),
        schema.start({
            updated: schemaUpdated,
            removed: jest.fn(),
        }),
    ]);
    yield test_1.sleepUntil(() => {
        return schema.getBranch("master").services.length >= 1;
    });
    yield remote.start();
    yield test_1.sleepUntil(() => {
        return schema.getBranch("master").services.length >= 2;
    });
    yield remoteWrong.stop();
    yield test_1.sleepUntil(() => {
        return schema.getBranch("master").latestVersion.routes.length >= 5;
    });
}));
describe("Schema registry integration retry test 2", () => {
    it("branch should gathered all services regardless of integration result except disconnected one", () => {
        const serviceIds = schema.getBranch("master").services.map(s => s.id);
        expect(serviceIds).toEqual(expect.arrayContaining([
            "master-a", "master-b",
        ]));
        expect(serviceIds).toHaveLength(2);
    });
    it("branch should retry merging failed integrations on succeed or skipped", () => {
        const routes = schema.getBranch("master").latestVersion.routes;
        expect(routes.length).toEqual(5); // graphql(3) +a +b
        expect(schemaUpdated).toHaveBeenCalledTimes(4); // created + initial +a +retry(b)
    });
});
afterAll(() => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
    yield Promise.all([
        schema.stop(),
        remote.stop(),
    ]);
}));
//# sourceMappingURL=schema.branch.retry2.spec.js.map
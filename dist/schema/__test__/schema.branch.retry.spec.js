"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const test_1 = require("../../test");
const moleculer = {
    namespace: "test-schema-branch-retry",
    transporter: {
        type: "TCP",
        options: {
            udpPeriod: 1,
        },
    },
};
const schema = test_1.getSchemaRegistry({
    logger: { level: "error", label: "gateway", silent: true },
    delegator: { moleculer: Object.assign(Object.assign({}, moleculer), { nodeID: "gateway" }) },
});
const remote = test_1.getMoleculerServiceBroker({
    logger: { level: "error", label: "remote" },
    moleculer: Object.assign(Object.assign({}, moleculer), { nodeID: "remote" }),
    services: [
        test_1.MoleculerServiceSchemaFactory.echo("master", "master-c", {
            protocol: {
                GraphQL: {
                    typeDefs: `
            type Gamma {
              beta: Beta!
            }
          `,
                    resolvers: {},
                },
            },
        }),
        test_1.MoleculerServiceSchemaFactory.echo("master", "master-b", {
            protocol: {
                GraphQL: {
                    typeDefs: `
            type Beta {
              alpha: Alpha!
            }
          `,
                    resolvers: {},
                },
            },
        }),
        test_1.MoleculerServiceSchemaFactory.echo("master", "master-a", {
            protocol: {
                GraphQL: {
                    typeDefs: `
            type Alpha {
              foo: String!
            }
          `,
                    resolvers: {},
                },
            },
        }),
    ],
});
jest.setTimeout(1000 * 20);
const schemaUpdated = jest.fn().mockName("listeners.updated.master");
beforeAll(() => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
    yield Promise.all([
        remote.start(),
        schema.start({
            updated: schemaUpdated,
            removed: jest.fn(),
        }),
    ]);
    yield test_1.sleepUntil(() => {
        return schema.getBranch("master").services.length >= 3 && schema.getBranch("master").latestVersion.routes.length >= 7;
    });
}));
describe("Schema registry integration retry test", () => {
    it("branch should gathered all services regardless of integration result", () => {
        const serviceIds = schema.getBranch("master").services.map(s => s.id);
        expect(serviceIds).toEqual(expect.arrayContaining([
            "master-a", "master-b", "master-c",
        ]));
        expect(serviceIds).toHaveLength(3);
    });
    it("branch should retry merging failed integrations", () => {
        const routes = schema.getBranch("master").latestVersion.routes;
        expect(routes.length).toEqual(7); // graphql(3) +a +b +c + introspection
        expect(schemaUpdated).toHaveBeenCalledTimes(4); // created + initial +a +retry(b, c)
    });
});
afterAll(() => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
    yield Promise.all([
        schema.stop(),
        remote.stop(),
    ]);
}));
//# sourceMappingURL=schema.branch.retry.spec.js.map
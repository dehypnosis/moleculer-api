import { sleep, getMoleculerServiceBroker, getSchemaRegistry, MoleculerServiceSchemaFactory, sleepUntil } from "../../test";

const moleculer = {
  namespace: "test-schema-branch-retry",
  transporter: {
    type: "TCP",
    options: {
      udpPeriod: 1,
    },
  },
};

const schema = getSchemaRegistry({
  logger: {level: "error", label: "gateway", silent: true},
  delegator: {moleculer: {...moleculer, nodeID: "gateway"}},
});

const remote = getMoleculerServiceBroker({
  logger: {level: "error", label: "remote"},
  moleculer: {...moleculer, nodeID: "remote"},
  services: [
    MoleculerServiceSchemaFactory.echo("master", "master-c", {
      protocol: {
        GraphQL: {
          typeDefs: `
            type Gamma {
              beta: Beta!
            }
          `,
          resolvers: {
            Query: null,
          },
        },
      },
    }),
    MoleculerServiceSchemaFactory.echo("master", "master-b", {
      protocol: {
        GraphQL: {
          typeDefs: `
            type Beta {
              alpha: Alpha!
            }
          `,
          resolvers: {
            Query: null,
          },
        },
      },
    }),
    MoleculerServiceSchemaFactory.echo("master", "master-a", {
      protocol: {
        GraphQL: {
          typeDefs: `
            type Alpha {
              foo: String!
            }
          `,
          resolvers: {
            Query: null,
          },
        },
      },
    }),
  ],
});

jest.setTimeout(1000 * 20);

const schemaUpdated = jest.fn().mockName("listeners.updated.master");
beforeAll(async () => {
  await Promise.all([
    remote.start(),
    schema.start({
      updated: schemaUpdated,
      removed: jest.fn(),
    }),
  ]);
  await sleepUntil(() => {
    return schema.getBranch("master")!.services.length >= 3 && schema.getBranch("master")!.latestVersion.routes.length >= 6;
  });
});

describe("Schema registry integration retry test", () => {
  it("branch should gathered all services regardless of integration result", () => {
    const serviceIds = schema.getBranch("master")!.services.map(s => s.id);
    expect(serviceIds).toEqual(expect.arrayContaining([
      "master-a", "master-b", "master-c",
    ]));
    expect(serviceIds).toHaveLength(3);
  });

  it("branch should retry merging failed integrations", () => {
    const routes = schema.getBranch("master")!.latestVersion.routes;
    expect(routes.length).toEqual(6); // graphql(3) +a +b +c
    expect(schemaUpdated).toHaveBeenCalledTimes(4); // created + initial +a +retry(b, c)
  });
});

afterAll(async () => {
  await Promise.all([
    schema.stop(),
    remote.stop(),
  ]);
});

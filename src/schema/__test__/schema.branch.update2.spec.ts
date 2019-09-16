import { sleep, getMoleculerServiceBroker, getSchemaRegistry, MoleculerServiceSchemaFactory, sleepUntil } from "../../test";

const moleculer = {
  namespace: "test-schema-branch-update-2",
  transporter: {
    type: "TCP",
    options: {
      udpPeriod: 1,
    },
  },
};

const schema = getSchemaRegistry({
  logger: {level: "error", label: "gateway"},
  delegator: {moleculer: {...moleculer, nodeID: "gateway"}},
});

const remote1 = getMoleculerServiceBroker({
  logger: {level: "error", label: "remote"},
  moleculer: {...moleculer, nodeID: "remote"},
  services: [
    MoleculerServiceSchemaFactory.echo("master", "master-a"),
    MoleculerServiceSchemaFactory.echo("master", "conflict-a", {
      protocol: {
        REST: {
          routes: [
            {
              method: "GET",
              path: "/echo",
              call: {
                action: `/conflict-a/echo`,
                params: {},
              },
            },
            {
              method: "GET",
              path: "/echo2",
              call: {
                action: `/conflict-a/echo`,
                params: {},
              },
            },
            {
              method: "GET",
              path: "/echo3",
              call: {
                action: `/conflict-a/echo`,
                params: {},
              },
            },
            {
              method: "GET",
              path: "/echo4",
              call: {
                action: `/conflict-a/echo`,
                params: {},
              },
            },
            {
              method: "GET",
              path: "/echo5",
              call: {
                action: `/conflict-a/echo`,
                params: {},
              },
            },
          ],
        },
      },
    }),
  ],
});

const remote2 = getMoleculerServiceBroker({
  logger: {level: "error", label: "remote2"},
  moleculer: {...moleculer, nodeID: "remote2"},
  services: [
    MoleculerServiceSchemaFactory.echo("dev", "conflict-a", {
      protocol: {
        REST: {
          routes: [
            {
              method: "GET",
              path: "/echo",
              call: {
                action: `/conflict-a/echo`,
                params: {},
              },
            },
          ],
        },
      },
    }),
  ],
});

jest.setTimeout(1000 * 20);

const mocks = {
  master: jest.fn().mockName("listeners.updated.master"),
  dev: jest.fn().mockName("listeners.updated.dev"),
};
beforeAll(async () => {
  await Promise.all([
    remote1.start(),
    remote2.start(),
    schema.start({
      updated: branch => mocks[branch.name as "dev" | "master"](),
      removed: jest.fn(),
    }),
  ]);
  await sleepUntil(() => {
    const dev = schema.getBranch("dev");
    return dev && dev.services.length >= 2 || false;
  });
  await remote2.stop();
  await sleepUntil(() => {
    const dev = schema.getBranch("dev");
    return dev && dev.latestVersion.routes.length >= 9 || false;
  });
});

describe("Schema registry update", () => {
  it("master branch should gathered master/non-branched services", () => {
    const serviceIds = schema.getBranch("master")!.services.map(s => s.id);
    expect(serviceIds).toEqual(expect.arrayContaining([
      "master-a", "conflict-a",
    ]));
    expect(serviceIds).toHaveLength(2);
  });

  it("dev should gathered dev/master/non-branched services and fall back to master branched service when dev branched service removed", () => {
    const serviceIds = schema.getBranch("dev")!.services.map(s => s.id);
    expect(serviceIds).toEqual(expect.arrayContaining([
      "master-a", "conflict-a",
    ]));
    expect(serviceIds).toHaveLength(2);
  });

  it("master branch should have 1+5+3 route by 4 updates", () => {
    expect(mocks.master).toBeCalledTimes(4); // created + initial + master-a + conflict-a
    expect(schema.getBranch("master")!.latestVersion.routes.length).toEqual(9); // +master-a + conflict-a/master + graphql(3)
  });

  it("dev branch should have same routes by at least 3 updates", () => {
    expect(mocks.dev.mock.calls.length).toBeGreaterThanOrEqual(3); // min: forked(+master-a +conflict-a/master) +conflict-a/dev -conflict-a/dev
    expect(mocks.dev.mock.calls.length).toBeLessThanOrEqual(5); // max: forked() +conflict-a/master +conflict-a/dev +master-a/master -conflict-a/dev
    expect(schema.getBranch("dev")!.latestVersion.routes.length).toEqual(9); // master-a + conflict-a/master + graphql(3)
  });
});

afterAll(async () => {
  await Promise.all([
    schema.stop(),
    remote1.stop(),
    remote2.stop(),
  ]);
});

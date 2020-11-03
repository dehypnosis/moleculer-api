import { mockRequest, mockResponse } from "jest-mock-req-res";
import { sleep, getMoleculerServiceBroker, getSchemaRegistry, MoleculerServiceSchemaFactory, sleepUntil } from "../../test";

const moleculer = {
  namespace: "test-schema-policy-scope",
  transporter: {
    type: "TCP",
    options: {
      udpPeriod: 1,
    },
  },
};

const schema = getSchemaRegistry({
  logger: {level: "error", label: "gateway", silent: false },
  delegator: {moleculer: {...moleculer, nodeID: "gateway"}},
});

const service1 = getMoleculerServiceBroker({
  logger: {level: "error", label: "service1"},
  moleculer: {...moleculer, nodeID: "service1"},
  services: [
    {
      name: "echo",
      metadata: {
        api: {
          branch: "master",
          protocol: {
            REST: {
              basePath: `/echo`,
              routes: [
                {
                  method: "GET",
                  path: "/foo",
                  call: {
                    action: `echo.foo`,
                    params: {
                      hello: "@query.hello",
                    },
                  },
                },
              ],
            },
          },
          policy: {
            call: [
              {
                actions: ["echo.**"],
                scope: ["scope1"],
                description: "all action call mappings require 'scope1' scope in the identity context",
              },
            ],
          },
        },
      },
      actions: {
        foo: {
          params: {
            hello: {
              type: "string",
              default: "world",
            },
          },
          async handler(ctx) {
            return ctx.params.hello;
          }
        },
      },
    },
  ],
});

jest.setTimeout(1000 * 20);

beforeAll(async () => {
  await Promise.all([
    service1.start(),
    schema.start({
      updated: jest.fn(),
      removed: jest.fn(),
    }),
    sleepUntil(() => !!schema.getBranch("master")?.services?.length, 1000),
  ]);
});

describe("schema policy should work", () => {
  it("master branch should gathered master/non-branched services", async () => {
    const branch = schema.getBranch("master")!;
    const echoFooEndpoint = branch.latestVersion.routes.find(r => r.path === "/echo/foo")!;
    const ctx = {
      get: jest.fn(),
      set: jest.fn(),
    };
    const req = mockRequest();
    const res = mockResponse();
    await echoFooEndpoint.handler(ctx, req, res);
    console.log(res.statusCode, res.send.mock);
  });
});

afterAll(async () => {
  await Promise.all([
    schema.stop(),
    service1.stop(),
  ]);
});

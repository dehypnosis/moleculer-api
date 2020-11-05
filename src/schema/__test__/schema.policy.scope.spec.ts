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

const policy = {
  call: [
    {
      actions: ["echo.authorized.*"],
      scope: ["echo-scope"],
      description: "all echo.authorized.* action call mappings require 'echo-scope' scope in the auth context",
    },
    {
      actions: ["echo.authorized.foo"],
      scope: ["echo-foo-scope"],
      description: "echo.authorized.foo action call mappings require 'echo-foo-scope' scope in the auth context",
    },
    {
      actions: ["echo.authorized.bar"],
      scope: ["echo-bar-scope"],
      filter: `({ context, ...args }) => !!context.auth.identity`,
      description: "echo.authorized.bar action call mappings require 'echo-bar-scope' and non-null identity in the auth context",
    },
  ],
};

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
                    action: `echo.authorized.foo`,
                    params: {
                      hello: "@query.hello",
                    },
                  },
                },
                {
                  method: "GET",
                  path: "/bar",
                  call: {
                    action: `echo.authorized.bar`,
                    params: {
                      hello: "@query.hello",
                    },
                  },
                },
                {
                  method: "GET",
                  path: "/foobar",
                  call: {
                    action: `echo.guest.fooBar`,
                    params: {},
                  },
                },
              ],
            },
          },
          policy,
        },
      },
      actions: {
        "authorized.foo": {
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
        "authorized.bar": {
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
        "guest.fooBar": () => {
          return true;
        },
        // $report: (ctx) => {
        //   console.log(ctx.params);
        // },
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
  it("scope plugin works", async () => {
    const branch = schema.getBranch("master")!;
    const echoFooEndpoint = branch.latestVersion.routes.find(r => r.path === "/echo/foo")!;
    const ctx = {
      get: jest.fn(),
      set: jest.fn(),
    };
    const req = mockRequest();
    const res = mockResponse();
    await expect(
      new Promise(async (resolve, reject) => {
        try {
          await echoFooEndpoint.handler(ctx, req, res);
          resolve();
        } catch (err) {
          reject(err);
        }
      })
    ).rejects.toThrow(expect.objectContaining({
      message: "permission denied",
      actual: [],
      expected: ["echo-scope", "echo-foo-scope"],
      description: [policy.call[0].description],
    }));
    expect(res.send.mock.calls.length).toEqual(0);

    const ctx2 = {
      get: jest.fn(),
      set: jest.fn(),
      auth: {
        scope: ["echo-scope", "echo-foo-scope"],
      },
    };
    const req2 = mockRequest();
    req2.query.hello = "world!";
    const res2 = mockResponse();
    await expect(
      new Promise(async (resolve, reject) => {
        try {
          await echoFooEndpoint.handler(ctx2, req2, res2);
          resolve();
        } catch (err) {
          reject(err);
        }
      })
    ).resolves.not.toThrow();
    expect(res2.send.mock.calls[0]).toEqual(["world!"]);
  });

  it("scope + filter plugin works", async () => {
    const branch = schema.getBranch("master")!;
    const echoFooEndpoint = branch.latestVersion.routes.find(r => r.path === "/echo/bar")!;
    const ctx = {
      get: jest.fn(),
      set: jest.fn(),
      auth: {
        scope: ["echo-scope"],
        identity: { sub: "adcd" },
      },
    };
    const req = mockRequest();
    const res = mockResponse();
    await expect(
      new Promise(async (resolve, reject) => {
        try {
          await echoFooEndpoint.handler(ctx, req, res);
          resolve();
        } catch (err) {
          reject(err);
        }
      })
    ).rejects.toThrow(expect.objectContaining({
      message: "permission denied",
      actual: ["echo-scope"],
      expected: ["echo-scope", "echo-bar-scope"],
      description: [
        policy.call[2].description,
      ],
    }));
    expect(res.send.mock.calls.length).toEqual(0);

    const ctx2 = {
      get: jest.fn(),
      set: jest.fn(),
      auth: {
        scope: ["echo-scope", "echo-bar-scope"],
      },
    };
    const req2 = mockRequest();
    const res2 = mockResponse();
    await expect(
      new Promise(async (resolve, reject) => {
        try {
          await echoFooEndpoint.handler(ctx2, req2, res2);
          resolve();
        } catch (err) {
          reject(err);
        }
      })
    ).rejects.toThrow(expect.objectContaining({
      message: "permission denied",
      description: [
        policy.call[2].description,
      ],
    }));
    expect(res2.send.mock.calls.length).toEqual(0);
  });

  it("(empty) plugin works", async () => {
    const branch = schema.getBranch("master")!;
    const echoFooBarEndpoint = branch.latestVersion.routes.find(r => r.path === "/echo/foobar")!;
    const ctx = {
      get: jest.fn(),
      set: jest.fn(),
    };
    const req = mockRequest();
    const res = mockResponse();
    await expect(
      new Promise(async (resolve, reject) => {
        try {
          await echoFooBarEndpoint.handler(ctx, req, res);
          resolve();
        } catch (err) {
          reject(err);
        }
      })
    ).resolves.not.toThrow();
    expect(res.send.mock.calls[0]).toEqual([true]);
  });
});

afterAll(async () => {
  await Promise.all([
    schema.stop(),
    service1.stop(),
  ]);
});

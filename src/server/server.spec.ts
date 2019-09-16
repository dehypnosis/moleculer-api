import { getSchemaRegistry, getAPIServer, fetch, sleep } from "../test";
import ws from "ws";

const moleculer = {
  namespace: "test-server-init",
  transporter: {
    type: "TCP",
    options: {
      udpPeriod: 1,
    },
  },
};

const server = getAPIServer({
  logger: {level: "error", label: "server"},
  schema: getSchemaRegistry({
    logger: {level: "error", label: "schema"},
    delegator: {moleculer: {...moleculer, nodeID: "gateway"}},
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

const serverWrong = getAPIServer({
  logger: {level: "error", label: "server-wrong"},
  schema: getSchemaRegistry({
    logger: {level: "error", label: "schema-wrong"},
    delegator: {moleculer: {...moleculer, nodeID: "gateway-wrong"}},
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
  let hash: string;
  beforeAll(async () => {
    await server.start();
    // @ts-ignore
    hash = server.props.schema.getBranch("master")!.latestVersion.shortHash;
  });

  it("check http protocol", () => {
    return expect(
      fetch("http://localhost:8080/graphql", {method: "GET"})
        .then(res => res.text())
        .then(text => {
          // console.log(text);
          return text;
        }),
    )
      .resolves.toBeTruthy();
  });

  it("check http protocol with branch", () => {
    return expect(
      fetch("http://localhost:8080/~master/graphql", {method: "GET"})
        .then(res => res.text())
        .then(text => {
          // console.log(text);
          return text;
        }),
    )
      .resolves.toBeTruthy();
  });

  it("check http protocol with version", () => {
    return expect(
      fetch(`http://localhost:8080/~master@${hash}/graphql`, {method: "GET"})
        .then(res => res.text())
        .then(text => {
          // console.log(text);
          return text;
        }),
    )
      .resolves.toBeTruthy();
  });

  it("check ws protocol", async () => {
    const wsClient = new ws("ws://localhost:8080/graphql");
    const mock = jest.fn();
    wsClient.once("open", mock);
    await sleep(1);
    return expect(mock).toHaveBeenCalled();
  });

  it("check ws protocol with branch", async () => {
    const wsClient = new ws("ws://localhost:8080/~master/graphql");
    const mock = jest.fn();
    wsClient.once("open", mock);
    await sleep(1);
    return expect(mock).toHaveBeenCalled();
  });

  it("check ws protocol with version", async () => {
    const wsClient = new ws(`ws://localhost:8080/~master@${hash}/graphql`);
    const mock = jest.fn();
    wsClient.once("open", mock);
    await sleep(1);
    return expect(mock).toHaveBeenCalled();
  });
});

afterAll(async () => {
  await server.stop();
  await serverWrong.stop();
});

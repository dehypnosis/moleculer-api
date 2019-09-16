import { fetch, sleep } from "./test";
import { APIGateway } from "./gateway";

const getOptions = (port: number) => ({
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
    winston: {level: "error"},
  },
});

describe("Gateway should listen in given protocol", () => {
  const gateway = new APIGateway(getOptions(38887));

  beforeAll(async () => {
    await gateway.start();
  });

  it("check http protocol", () => {
    return expect(
      fetch("http://localhost:38887/graphql", {method: "GET"})
        .then(res => res.text())
        .then(text => {
          // console.log(text);
          return text;
        }),
    )
      .resolves.toBeTruthy();
  });

  afterAll(async () => {
    await gateway.stop();
  });
});

describe("Gateway should gracefully shutdown", () => {
  APIGateway.ShutdownSignals.forEach((SIGNAL, i) => {
    const port = 38887 + i;
    const gateway = new APIGateway(getOptions(port));

    beforeAll(async () => {
      await gateway.start();
    });

    it(`${SIGNAL} signal`, async () => {
      process.emit(SIGNAL as any, SIGNAL as any);
      await sleep(1);
      return expect(
        fetch(`http://localhost:${port}/graphql`, {method: "GET"})
          .then(res => res.text())
          .then(text => {
            // console.log(text);
            return text;
          }),
      )
        .rejects.toThrowError();
    });

    afterAll(async () => {
      await gateway.stop();
    });
  });
});

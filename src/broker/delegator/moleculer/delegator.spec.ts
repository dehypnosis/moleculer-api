import { getServiceBroker } from "../../../test";

describe("moleculer service broker test", () => {
  const broker = getServiceBroker({
    delegator: {
      moleculer: {
        transporter: "TCP",
      },
    },
  });
  const mocks = {
    connected: jest.fn(),
    disconnected: jest.fn(),
    nodePoolUpdated: jest.fn(),
  };
  beforeAll(async () => {
    await broker.start(mocks);
  });

  it("broker can health check subscription", () => {
    return expect(broker.healthCheckSubscribe()).resolves.toMatchObject({code: 200});
  });

  it("broker should not discovered anything yet", () => {
    expect(mocks.connected).not.toHaveBeenCalled();
    expect(mocks.disconnected).not.toHaveBeenCalled();
    expect(mocks.nodePoolUpdated).not.toHaveBeenCalled();
  });

  afterAll(async () => {
    await broker.stop();
  });
});

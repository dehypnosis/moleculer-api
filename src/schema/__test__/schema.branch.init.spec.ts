import { getSchemaRegistry, sleep } from "../../test";

const schema = getSchemaRegistry();
describe("Schema registry start", () => {
  const mock = jest.fn().mockName("listeners.updated.master");
  beforeAll(async () => {
    await schema.start({
      updated: branch => {
        if (branch.isMaster) {
          mock();
        }
      },
      removed: jest.fn(),
    });
    await sleep(1);
  });

  it("master branch should have been updated twice on start", () => {
    expect(mock).toBeCalledTimes(2); // created + initially compiled
  });

  afterAll(async () => {
    await schema.stop();
  });
});

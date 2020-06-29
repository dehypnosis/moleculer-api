import { gateway } from "./gateway";

jest.setTimeout(5 * 1000);

describe("Test 'gateway'", () => {
  afterAll(() => gateway.stop());

  describe("Simple working test", () => {
    it("started well", () => {
      return expect(gateway.start()).resolves.not.toThrow();
    });
  });
});

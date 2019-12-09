import { gateway } from "./gateway";

describe("Test 'gateway'", () => {
  afterAll(() => gateway.stop());

  describe("Simple working test", () => {
    it("started well", () => {
      return expect(gateway.start()).resolves.not.toThrow();
    });
  });
});

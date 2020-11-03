import { getLogger } from "../../../../test";
import { ScopePolicyPlugin } from "./plugin";

describe("Filter policy schema validation test", () => {
  const plugin = new ScopePolicyPlugin({
    logger: getLogger(),
  });

  it("valid schema should be return true", () => {
    return expect(plugin.validateSchema(["any", "scope", "here"])).toMatchObject([]);
  });

  it("invalid schema should be return errors", () => {
    return expect(plugin.validateSchema("12345" as any)).toMatchObject(expect.arrayContaining([
      expect.objectContaining({
        type: "array",
      }),
    ]));
  });
});

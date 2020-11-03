import { getLogger } from "../../../../test";
import { FilterPolicyPlugin } from "./plugin";

describe("Filter policy schema validation test", () => {
  const plugin = new FilterPolicyPlugin({
    logger: getLogger(),
  });

  it("valid schema should be return true", () => {
    return expect(plugin.validateSchema("({ params, response }) => ({ response, params})")).toMatchObject([]);
  });

  it("invalid schema should be return errors", () => {
    return expect(plugin.validateSchema("12345")).toMatchObject(expect.arrayContaining([
      expect.objectContaining({
        expected: "JavaScriptFunctionString",
      }),
    ]));
  });
});

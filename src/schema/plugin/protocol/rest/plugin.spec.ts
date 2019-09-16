import { getLogger } from "../../../../test";
import { RESTProtocolPlugin } from "./plugin";

describe("REST schema validation test", () => {
  const plugin = new RESTProtocolPlugin({
    logger: getLogger(),
    policyPlugins: [],
  });

  it("valid schema should be return true", () => {
    return expect(plugin.validateSchema({
      description: "..",
      basePath: "/players",
      routes: [
        {
          method: "GET",
          path: "/test",
          description: "",
          deprecated: false,
          call: {
            params: {},
            action: "",
          },
          ignoreError: true,
        },
        {
          method: "POST",
          path: "/test",
          description: "",
          deprecated: false,
          publish: {
            event: "",
            params: {},
          },
        },
        {
          method: "GET",
          path: "/test3",
          description: "",
          deprecated: false,
          map: "({ params, response }) => ({ response, params})",
        },
      ],
    })).toMatchObject([]);
  });
});

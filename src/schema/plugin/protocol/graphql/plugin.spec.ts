import { getLogger } from "../../../../test";
import { GraphQLProtocolPlugin } from "./plugin";

describe("GraphQL schema validation test", () => {
  const plugin = new GraphQLProtocolPlugin({
    logger: getLogger(),
    policyPlugins: [],
  });

  it("valid schema should be return true", () => {
    return expect(plugin.validateSchema({
      description: "..",
      typeDefs: `
      type Player implements xx {
        name: String
      }
      type Query {
        viewer: Number
      }
      type Mutation implements abcd & efgh {
        test: String
      }
      extend type Mutation implements test  {
        test: Number
      }
      interface test {
        name: String!
      }
      extend interface test {
        phone: Number
      }
      type Hello {
        a: String!
      }
    `,
      resolvers: {
        Player: {
          // @ts-ignore
          __isTypeOf: "",
          // @ts-ignore
          name: {
            call: {
              action: "test",
              params: {},
            },
          },
        },
        // @ts-ignore
        Query: {
          viewer: {
            call: {
              action: "upload",
              params: {
                stream: "@.body.file",
                meta: {
                  filename: "@.body.name",
                },
              },
              map: "() => { return 1; }",
            },
            ignoreError: true,
          },
        },
        Mutation: {
          test: {
            call: {
              action: "test",
              params: {},
            },
          },
          // @ts-ignore
          __isTypeOf: "() => true" as any,
        },
      },
    })).toMatchObject([]);
  });
});

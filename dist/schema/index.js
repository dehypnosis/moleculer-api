"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var registry_1 = require("./registry");
exports.SchemaRegistry = registry_1.SchemaRegistry;
var branch_1 = require("./branch");
exports.Branch = branch_1.Branch;
var version_1 = require("./version");
exports.Version = version_1.Version;
/*
const example: ServiceAPISchema = {
  branch: "master",
  protocol: {
    GraphQL: {
      description: "hello world",
      typeDefs: `
        extend type Query {
          hello: String!
        }
      `,
      resolvers: {
        Query: {
          hello: `() => "world"`,
        },
      },
    },
    REST: {
      description: "...",
      basePath: "/foo",
      routes: [],
    },
    WebSocket: {
      description: "....",
      basePath: "/chat",
      routes: [],
    },
  },
  policy: {},
};
*/
//# sourceMappingURL=index.js.map
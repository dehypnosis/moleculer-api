"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var registry_1 = require("./registry");
Object.defineProperty(exports, "SchemaRegistry", { enumerable: true, get: function () { return registry_1.SchemaRegistry; } });
var branch_1 = require("./branch");
Object.defineProperty(exports, "Branch", { enumerable: true, get: function () { return branch_1.Branch; } });
var version_1 = require("./version");
Object.defineProperty(exports, "Version", { enumerable: true, get: function () { return version_1.Version; } });
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
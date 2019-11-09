import { APIGateway } from "./gateway";
import { getMoleculerServiceBroker } from "./test";
import fs from "fs";
import path from "path";
import { ReadableStream as ReadableMemoryStream } from "memory-streams";
import ReadableStream = NodeJS.ReadableStream;

const gateway = new APIGateway({
  brokers: [
    {
      moleculer: {
        nodeID: "gateway-node",
        namespace: "dev-gateway",
        transporter: {
          type: "TCP",
          udpPeriod: 1,
        },
      },
    },
  ],
  schema: {
    branch: {
      maxVersions: 1,
    },
  },
  server: {
    update: {
      debouncedSeconds: 0,
    },
    protocol: {
      http: {
        port: 8080,
      },
    },
    middleware: [
      {
        cors: {
          // origin: [
          //   "https://www.google.com",
          // ],
        },
      },
    ],
  },
  logger: {
    winston: {level: "info"},
  },
});

const services = getMoleculerServiceBroker({
  moleculer: {
    nodeID: "remote-node",
    namespace: "dev-gateway",
    transporter: {
      type: "TCP",
      udpPeriod: 1,
    },
  },
  services: [
    {
      name: "chat",
      metadata: {
        api: {
          branch: "master",
          policy: {},
          protocol: {
            WebSocket: {
              basePath: "/chat",
              description: "...",
              routes: [
                {
                  path: "/:roomId",
                  subscribe: {
                    events: `({ path }) => ["chat.root." + path.roomId]`,
                  },
                  publish: {
                    event: `({ path }) => "chat.root." + path.roomId`,
                    params: "@message",
                  },
                },
                {
                  path: "/streaming/:roomId",
                  call: {
                    action: "chat.streaming",
                    params: {
                      roomId: "@path.roomId",
                    },
                  },
                },
              ],
            },
          },
        },
      },
      actions: {
        streaming: {
          handler(ctx) {
            const serverStream = new ReadableMemoryStream("---initial-content-from-server---");
            const clientStream = ctx.params! as ReadableStream;
            clientStream.on("data", data => {
              // @ts-ignore
              serverStream.append("---remote service received data and echo: " + data.toString() + "---");
            });
            return serverStream;
          },
        },
      },
    },
    {
      name: "file",
      metadata: {
        api: {
          branch: "master",
          protocol: {
            REST: {
              description: "..",
              basePath: "/file",
              routes: [
                {
                  method: "POST",
                  path: "/",
                  call: {
                    action: "file.upload",
                    params: "@body.file",
                  },
                },
                {
                  method: "GET",
                  path: "/:filename",
                  call: {
                    action: "file.get",
                    params: {
                      filename: "@path.filename",
                    },
                  },
                },
              ],
            },
          },
          policy: {},
        },
      },
      actions: {
        upload(ctx) {
          return new Promise((resolve, reject) => {
            if (!ctx.params || !ctx.params.pipe) {
              throw new Error("no file to upload");
            }
            const meta = ctx.meta;
            const saveStream = fs.createWriteStream(path.join(__dirname, "..", "tmp." + (meta.filename || "unknown-file")));
            ctx.params.pipe(saveStream);
            ctx.params.on("end", () => resolve(meta));
            ctx.params.on("error", reject);
          });
        },
        get: {
          params: {
            filename: "string",
          },
          handler(ctx) {
            const filepath = path.join(__dirname, "..", "tmp." + ctx.params!.filename);
            if (!fs.statSync(filepath).isFile()) {
              throw new Error("no such file");
            }
            // ctx.meta.$headers = {
            //   Location: "https://google.com",
            // };
            // ctx.meta.$status = 302;
            return fs.createReadStream(filepath);
          },
        },
      },
    },
    {
      name: "foo",
      metadata: {
        api: {
          branch: "master",
          protocol: {
            REST: {
              description: "test..",
              basePath: "/foo",
              routes: [
                {
                  method: "GET",
                  path: "/bar",
                  map: `() => { throw new Error("what an error"); }`,
                },
                {
                  method: "GET",
                  path: "/:id",
                  call: {
                    action: "foo.get",
                    params: {},
                  },
                },
                {
                  method: "GET",
                  path: "/:a/:b/:c?",
                  map: `(args) => args`,
                },
              ],
            },
            GraphQL: {
              description: "blablabla",
              typeDefs: `
                      interface Node {
                        id: String
                      }
                      type Foo implements Node {
                        id: String
                      }
                      extend type Query {
                        foo(id: ID!): Foo
                      }
                      extend type Mutation {
                        uploadFile(file: Upload!): File!
                      }
                      type File {
                        mimetype: String
                        encoding: String
                        filename: String
                      }
                    `,
              resolvers: {
                Foo: {
                  id: `({ source }) => source.id`,
                  __isTypeOf: `({ source }) => source && source.__isFoo`,
                },
                Query: {
                  foo: {
                    call: {
                      action: "foo.get",
                      params: {
                        id: "@args.id[]",
                      },
                      map: `({ response }) => ({ ...response, __isFoo: true })`,
                    },
                    ignoreError: true,
                  },
                },
                Mutation: {
                  uploadFile: {
                    call: {
                      action: "foo.noop",
                      params: {
                        file: "@args.file",
                      },
                      map: `({ params }) => params.file`,
                    },
                  },
                },
              },
            },
          },
          policy: {},
        },
      },
      actions: {
        get: {
          params: {
            id: ["string", {
              type: "array",
              items: "string",
            }],
          },
          handler(ctx) {
            const id = ctx.params!.id;
            if (Array.isArray(id)) { // batching
              // tslint:disable-next-line:no-shadowed-variable
              return id.map(id => ({id}));
            }
            return {id}; // single
          },
        },
        noop(ctx) {
          console.log("foo.noop got:", ctx.params);
        },
      },
    },
  ],
});

(async () => {
  await gateway.start();
  await services.start();
})();

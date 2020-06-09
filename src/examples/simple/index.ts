import fs from "fs";
import path from "path";
import MemoryStream from "memorystream";
import ReadableStream = NodeJS.ReadableStream;
import { APIGateway, createAuthContextOIDCParser } from "../../";
import { getMoleculerServiceBroker } from "../../test";

/* create gateway and run */
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
      // https: {
      //   key: fs.readFileSync(path.join(__dirname, "../../https/key.pem")),
      //   cert: fs.readFileSync(path.join(__dirname, "../../https/server.crt")),
      // },
    },
    context: {
      auth: {
        parser: createAuthContextOIDCParser({
          issuer: "https://account.dev.qmit.pro",
          client_id: "test",
          client_secret: "3322b0c4c46443c88770041d05531dc994c8121d36ee4a21928c8626b09739d7",
        }),
      },
    },
    middleware: {
      cors: false,
      serveStatic: {
        dirRootPath: __dirname + "/__test__",
        routeBasePath: "/",
      },
      // logging: {
      //   level: "debug",
      // },
    },
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
                /* bidirectional streaming chat */
                {
                  path: "/message-stream/:roomId",
                  call: {
                    action: "chat.message.stream",
                    params: {
                      roomId: "@path.roomId",
                    },
                  },
                },
                /* pub/sub chat */
                {
                  path: "/message-pubsub/:roomId",
                  subscribe: {
                    events: `({ path }) => ["chat.message." + path.roomId]`,
                  },
                  publish: {
                    event: `({ path }) => "chat.message." + path.roomId`,
                    params: "@message",
                  },
                },
                /* pub/sub video */
                {
                  path: "/video-pubsub",
                  subscribe: {
                    events: ["chat.video"],
                  },
                  publish: {
                    event: "chat.video",
                    params: {
                      id: "@context.id",
                      username: "@query.username",
                      data: "@message",
                    },
                    filter: `({ params }) => params.id && params.username && params.data`,
                  },
                },
                /* streaming video */
                {
                  path: "/video-stream/:type",
                  call: {
                    action: "chat.video.stream",
                    params: {
                      id: "@context.id",
                      type: "@path.type",
                    },
                  },
                },
              ],
            },
          },
        },
      },
      actions: {
        "message.stream": {
          handler(ctx) {
            // bidirectional
            const serverStream = new MemoryStream("---initial-content-from-server---");
            const clientStream = ctx.params! as ReadableStream;
            clientStream.on("data", data => {
              serverStream.write("---remote service received data and echo: " + data.toString() + "---");
            });
            return serverStream;
          },
        },
        "video.stream": {
          handler(ctx) {
            // mono-directional
            const {id, type} = (ctx.meta || {}) as any;
            if (!id || !type) {
              throw new Error("invalid params");
            }

            if (type === "server") {
              // store server stream
              if (this.serverStream) {
                throw new Error("server is already going on");
              }

              const stream = ctx.params! as ReadableStream;
              if (!stream || !stream.pipe) {
                throw new Error("invalid stream for server");
              }

              this.serverStream = stream;
              if (!this.clientStreams) {
                this.clientStreams = [];
              }

              stream.on("close", () => {
                delete this.serverStream;
                delete this.metaChunks;
              });

              this.metaChunks = null;
              stream.on("data", data => {
                this.lastPacketTime = new Date().getTime();
                if (!this.metaChunks) {
                  this.metaChunks = [];
                }
                if (this.metaChunks.length < 2) {
                  this.metaChunks.push(data);
                  console.log(`collecting meta chunks... (${this.metaChunks.length}/2)`);
                }
                this.clientStreams.forEach((clientStream: any) => clientStream.write(data));
              });

              this.interval = setInterval(() => {
                if (this.lastPacketTime && new Date().getTime() - this.lastPacketTime > 1000 * 5) {
                  // @ts-ignore
                  stream.destroy();
                  clearInterval(this.interval);
                  delete this.interval;
                  console.log("server stream closed due to interval timeout 5s", id);
                }
              }, 1000);
              console.log("server stream created", id);
            } else {
              if (!this.serverStream) {
                throw new Error("there are no server going on");
              }

              // new stream for client
              const stream = new MemoryStream();
              console.log("client stream created", id);
              if (this.metaChunks) {
                console.log(`send meta chunks (${this.metaChunks.length}) to ${id}`);
                for (const chunk of this.metaChunks) {
                  stream.write(chunk);
                }
              }
              stream.on("close", () => {
                const index = (this.clientStreams as MemoryStream[]).indexOf(stream);
                if (index !== -1) {
                  this.clientStreams.splice(index, 1);
                  console.log("client stream closed", id);
                }
              });
              this.clientStreams.push(stream);

              return stream;
            }
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
            if (!ctx.params || !(ctx.params! as any).pipe) {
              throw new Error("no file to upload");
            }
            const meta = ctx.meta as any;
            const saveStream = fs.createWriteStream(path.join(__dirname, "..", "tmp." + (meta.filename || "unknown-file")));
            (ctx.params! as any).pipe(saveStream);
            (ctx.params! as any).on("end", () => resolve(meta));
            (ctx.params! as any).on("error", reject);
          });
        },
        get: {
          params: {
            filename: "string",
          },
          handler(ctx) {
            const filepath = path.join(__dirname, "..", "tmp." + (ctx.params! as any).filename);
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
                      map: `({ request }) => request.params.file`,
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
            const id = (ctx.params! as any).id;
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

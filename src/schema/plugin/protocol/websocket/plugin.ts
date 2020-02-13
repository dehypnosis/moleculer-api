import { ValidationRule } from "fastest-validator";
import * as _ from "lodash";
import { hashObject, isReadStream, RecursivePartial, validateObject, validateValue, ValidationError } from "../../../../interface";
import { ServiceAPIIntegration } from "../../../integration";
import { WebSocketRoute, Route, WebSocketRouteHandler } from "../../../../server";
import { ConnectorCompiler, ConnectorValidator } from "../../connector";
import { ProtocolPlugin, ProtocolPluginProps } from "../plugin";
import { WebSocketProtocolPluginSchema, WebSocketProtocolPluginCatalog, WebSocketRouteSchema, WebSocketPubSubRouteSchema, WebSocketStreamingRouteSchema } from "./schema";
import { createStreamFromWebSocket } from "./stream";
import ReadableStream = NodeJS.ReadableStream;

export type WebSocketProtocolPluginOptions = {};

export class WebSocketProtocolPlugin extends ProtocolPlugin<WebSocketProtocolPluginSchema, WebSocketProtocolPluginCatalog> {
  public static readonly key = "WebSocket";
  public static readonly autoLoadOptions: WebSocketProtocolPluginOptions = {};
  private opts: WebSocketProtocolPluginOptions;

  constructor(protected readonly props: ProtocolPluginProps, opts?: RecursivePartial<WebSocketProtocolPluginOptions>) {
    super(props);
    this.opts = _.defaultsDeep(opts || {}, WebSocketProtocolPlugin.autoLoadOptions);
  }

  public async start(): Promise<void> {
  }

  public async stop(): Promise<void> {
  }

  public validateSchema(schema: Readonly<WebSocketProtocolPluginSchema>): ValidationError[] {
    const routePaths: string[] = [];
    return validateObject(schema, {
      description: {
        type: "string",
      },
      basePath: {
        type: "custom",
        check(value) {
          if (WebSocketRoute.isNonRootStaticPath(value)) {
            return true;
          }
          return [{
            type: "basePathInvalid",
            field: "basePath",
            actual: value,
            expected: WebSocketRoute.nonRootStaticPathRegExp,
            message: `basePath should be a valid non-root static path: eg. "/chat" | "/chat/lobby"`,
          }];
        },
      },
      routes: {
        type: "array",
        empty: false,
        items: {
          type: "custom",
          check(value) {
            const idx = schema.routes.indexOf(value);
            if (typeof value !== "object") {
              return [{
                field: `routes[${idx}]`,
                type: "type",
                message: "route definition should be an object",
                actual: value,
              }];
            }

            const {path, description, deprecated, ...restProps} = value;

            // path: string;
            if (!WebSocketRoute.isNonRootDynamicPath(path) && !WebSocketRoute.isRootStaticPath(path)) {
              return [{
                field: `routes[${idx}].path`,
                type: "routePathInvalid",
                actual: path,
                expected: [WebSocketRoute.nonRootDynamicPath, WebSocketRoute.rootStaticPathRegExp],
                message: `route path should be a valid path: eg. "/" | "/rooms" | "/rooms/:id"`,
              }];
            }

            const errors = validateObject(restProps, {
              description: {
                type: "string",
                optional: true,
              },
              deprecated: {
                type: "boolean",
                optional: true,
              },
            }, {
              strict: true,
              field: `routes[${idx}]`,
            });

            if (errors.length === 0) {
              // check duplicate path
              if (routePaths.includes(path)) {
                return [{
                  field: `routes[${idx}].path`,
                  type: "routePathDuplicate",
                  actual: path,
                  expected: undefined,
                  message: `a route path should be unique"`,
                }];
              }
              routePaths.push(path);
            }

            // validate streaming route / pub-sub route
            let rule: ValidationRule | ValidationRule[];
            if (typeof restProps.call !== "undefined") {
              rule = {
                type: "object",
                strict: true,
                props: {
                  call: ConnectorValidator.call,
                  // binary: {
                  //   type: "boolean",
                  //   optional: true,
                  // },
                },
                messages: {
                  objectStrict: "WebSocketStreamingRouteSchema cannot be with other connectors",
                },
              };
            } else if (typeof restProps.subscribe !== "undefined" || typeof restProps.publish !== "undefined") {
              rule = {
                type: "object",
                strict: true,
                props: {
                  subscribe: ConnectorValidator.subscribe,
                  publish: ConnectorValidator.publish,
                  ignoreError: {
                    type: "boolean",
                    optional: true,
                  },
                },
                messages: {
                  objectStrict: "WebSocketPubSubRouteSchema cannot be with other connectors",
                },
              };
            } else {
              errors.push({
                type: "routeInvalid",
                field: `routes[${idx}]`,
                message: `WebSocket should have either publish/subscribe or call property`,
                expected: "WebSocketPubSubRouteSchema | WebSocketStreamingRouteSchema",
              });
            }

            errors.push(...validateValue(restProps,
              // @ts-ignore
              rule, {
                strict: true,
                field: `routes[${idx}]`,
              }));

            return errors;
          },
        },
      },
    }, {
      strict: true,
    });
  }

  public compileSchemata(routeHashMapCache: Readonly<Map<string, Readonly<Route>>>, integrations: Readonly<ServiceAPIIntegration>[]): { hash: string; route: Readonly<Route>; }[] {
    const items = new Array<{ hash: string, route: Readonly<WebSocketRoute> }>();

    for (const integration of integrations) {
      const schema: WebSocketProtocolPluginSchema = (integration.schema.protocol as any)[this.key];
      for (const routeSchema of schema.routes) {

        // the source object below hash contains properties which can make this route unique
        const routeHash = hashObject([schema.basePath, routeSchema, integration.service.hash], true);

        // cache hit
        const cachedRoute = routeHashMapCache.get(routeHash);
        if (cachedRoute) {
          items.push({hash: routeHash, route: cachedRoute});
          continue;
        }

        // compile new route
        const path = WebSocketRoute.mergePaths(schema.basePath, routeSchema.path);
        const route: Readonly<Route> = typeof (routeSchema as WebSocketStreamingRouteSchema).call !== "undefined"
          ? this.createRouteFromWebSocketStreamingRouteScheme(path, routeSchema as WebSocketStreamingRouteSchema, integration)
          : this.createRouteFromWebSocketPubSubRouteScheme(path, routeSchema as WebSocketPubSubRouteSchema, integration);

        items.push({hash: routeHash, route});
      }
    }

    return items;
  }

  private createRouteFromWebSocketPubSubRouteScheme(path: string, schema: WebSocketPubSubRouteSchema, integration: Readonly<ServiceAPIIntegration>): Readonly<WebSocketRoute> {
    const subscribeConnector = ConnectorCompiler.subscribe(schema.subscribe, integration, this.props.policyPlugins, {
      mappableKeys: ["context", "path", "query"],
      getAsyncIterator: false,
    });

    const publishConnector = ConnectorCompiler.publish(schema.publish, integration, this.props.policyPlugins, {
      mappableKeys: ["context", "path", "query", "message"],
    });

    const ignoreError = schema.ignoreError;

    const handler: WebSocketRouteHandler = async (context, socket, req) => {
      const {params, query} = req;

      // subscribe and proxy message to socket
      const mappableSubscriptionArgs = {context, path: params, query};
      await subscribeConnector(context, mappableSubscriptionArgs, (message) => {
        if (typeof message !== "string") {
          try {
            message = JSON.stringify(message);
          } catch {
          }
        }

        socket.send(message, error => {
          if (error && ignoreError !== true) {
            socket.emit("error", error);
          }
        });
      });

      // publish received messages
      socket.on("message", async (message: any) => {
        // pub/sub route cannot receive binary message
        if (Buffer.isBuffer(message) || typeof message !== "string") {
          throw new Error("unexpected message type"); // TODO: normalize error
        } else {
          // parse text message
          try {
            message = JSON.parse(message);
          } catch {
          }
        }

        const mappableArgs = {context, path: params, query, message};
        try {
          await publishConnector(context, mappableArgs);
        } catch (error) {
          if (ignoreError !== true) {
            socket.emit("error", error);
          }
        }
      });
    };

    return new WebSocketRoute({
      path,
      description: (schema as WebSocketRouteSchema).description || null,
      handler,
    });
  }

  private createRouteFromWebSocketStreamingRouteScheme(path: string, schema: WebSocketStreamingRouteSchema, integration: Readonly<ServiceAPIIntegration>): Readonly<WebSocketRoute> {
    const callConnector = ConnectorCompiler.call(schema.call, integration, this.props.policyPlugins, {
      explicitMappableKeys: ["context", "path", "query"],
      implicitMappableKeys: ["path"],
      batchingEnabled: false,
      disableCache: true,
    });

    // const binary = schema.binary !== false;

    const handler: WebSocketRouteHandler = async (context, socket, req) => {
      const errorListeners = socket.listeners("error");
      try {
        // create websocket stream
        const clientStream: ReadableStream = createStreamFromWebSocket(socket, {
          allowHalfOpen: false,
          readableObjectMode: true,
        });

        // proxy stream error to socket error handler
        for (const listener of errorListeners) {
          clientStream.on("error", (evt) => {
            delete evt.target; // send except socket prop
            listener(evt);
          });
        }

        // call endpoint with client stream (client -> server)
        const {params, query} = req;
        const mappableArgs = {context, path: params, query};
        const result = await callConnector(context, mappableArgs, {
          // inject client websocket stream to broker delegator
          createReadStream: () => clientStream,
        });

        // for bidirectional stream support (client <- server)
        if (result && typeof result.createReadStream === "function") {
          const serverStream = result.createReadStream() as ReadableStream;
          if (!isReadStream(serverStream)) {
            throw new Error("invalid stream response"); // TODO: normalize error
          }
          // read server stream then write to socket
          serverStream.on("data", data => socket.send(data));
        }

        // other result props ignored
      } catch (error) {
        socket.emit("error", error);
      }
    };

    return new WebSocketRoute({
      path,
      description: (schema as WebSocketRouteSchema).description || null,
      handler,
    });
  }

  public describeSchema(schema: Readonly<WebSocketProtocolPluginSchema>): WebSocketProtocolPluginCatalog {
    // TODO: WebSocket Catalog
    return {} as WebSocketProtocolPluginCatalog;
  }
}

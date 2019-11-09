import * as _ from "lodash";
import { RecursivePartial, hashObject, validateObject, validateValue, ValidationError, ValidationRule, isReadStream } from "../../../../interface";
import { ServiceAPIIntegration } from "../../../integration";
import { Route, HTTPRoute, HTTPRouteHandler, HTTPRouteResponse } from "../../../../server";
import { ProtocolPlugin, ProtocolPluginProps } from "../plugin";
import { MultipartFormDataHandler } from "./handler";
import { RESTProtocolPluginSchema, RESTProtocolPluginCatalog, RESTCallableRouteResolverSchema, RESTMappableRouteResolverSchema, RESTPublishableRouteResolverSchema, RESTRouteSchema } from "./schema";
import { ConnectorCompiler, ConnectorValidator } from "../../connector";
import ReadableStream = NodeJS.ReadableStream;

export type RESTProtocolPluginOptions = {
  uploads: {
    maxFiles: number; // number
    maxFileSize: number; // byte
  };
};

export class RESTProtocolPlugin extends ProtocolPlugin<RESTProtocolPluginSchema, RESTProtocolPluginCatalog> {
  public static readonly key = "REST";
  public static readonly autoLoadOptions: RESTProtocolPluginOptions = {
    uploads: {
      maxFiles: Infinity,
      maxFileSize: Infinity,
    },
  };
  private readonly opts: RESTProtocolPluginOptions;

  constructor(protected readonly props: ProtocolPluginProps, opts?: RecursivePartial<RESTProtocolPluginOptions>) {
    super(props);
    this.opts = _.defaultsDeep(opts || {}, RESTProtocolPlugin.autoLoadOptions);
  }

  public async start(): Promise<void> {
  }

  public async stop(): Promise<void> {
  }

  public validateSchema(schema: Readonly<RESTProtocolPluginSchema>): ValidationError[] {
    const routeMethodAndPaths: string[] = [];
    return validateObject(schema, {
      description: {
        type: "string",
      },
      basePath: {
        type: "custom",
        check(value) {
          if (HTTPRoute.isNonRootStaticPath(value)) {
            return true;
          }
          return [{
            type: "basePathInvalid",
            field: "basePath",
            actual: value,
            expected: HTTPRoute.nonRootStaticPathRegExp,
            message: `basePath should be a valid non-root static path: eg. "/players" | "/players/billings"`,
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

            const {path, deprecated, description, method, ...restProps} = value;

            // path: string;
            if (!HTTPRoute.isNonRootDynamicPath(path) && !HTTPRoute.isRootStaticPath(path)) {
              return [{
                field: `routes[${idx}].path`,
                type: "routePathInvalid",
                actual: path,
                expected: [HTTPRoute.nonRootDynamicPath, HTTPRoute.rootStaticPathRegExp],
                message: `route path should be a valid path: eg. "/" | "/accounts" | "/accounts/:id"`,
              }];
            }

            // description?: string;
            // deprecated?: boolean;
            // method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE"
            const errors = validateObject({deprecated, description, method}, {
              description: {
                type: "string",
                optional: true,
              },
              deprecated: {
                type: "boolean",
                optional: true,
              },
              method: {
                type: "enum",
                values: ["GET", "POST", "PUT", "PATCH", "DELETE"],
              },
            }, {
              strict: true,
              field: `routes[${idx}]`,
            });

            if (errors.length === 0) {
              // check duplicate path
              const routePathAndMethod = `${method} ${path}`;
              if (routeMethodAndPaths.includes(routePathAndMethod)) {
                return [{
                  field: `routes[${idx}].path`,
                  type: "routePathDuplicate",
                  actual: routePathAndMethod,
                  expected: undefined,
                  message: `a pair of route method and path should be unique"`,
                }];
              }
              routeMethodAndPaths.push(routePathAndMethod);
            }

            // validate method and each connector
            let rule: ValidationRule | ValidationRule[];
            switch (method) {
              case "GET":
                if (typeof restProps.call !== "undefined") {
                  rule = {
                    type: "object",
                    strict: true,
                    props: {
                      call: ConnectorValidator.call,
                      ignoreError: {
                        type: "boolean",
                        optional: true,
                      },
                    },
                    messages: {
                      objectStrict: "RESTCallableRouteResolverSchema cannot be with other connectors",
                    },
                  };
                } else if (typeof restProps.map !== "undefined") {
                  rule = {
                    type: "object",
                    strict: true,
                    props: {
                      map: ConnectorValidator.map,
                    },
                    messages: {
                      objectStrict: "RESTMappableRouteResolverSchema cannot be with other connectors",
                    },
                  };
                } else {
                  errors.push({
                    type: "routeInvalid",
                    field: `routes[${idx}]`,
                    message: `${method} route should have either call or map property`,
                    expected: "RESTCallableRouteResolverSchema | RESTMappableRouteResolverSchema",
                  });
                }
                break;

              case "POST":
              case "PUT":
              case "PATCH":
              case "DELETE":
                if (typeof restProps.call !== "undefined") {
                  rule = {
                    type: "object",
                    strict: true,
                    props: {
                      call: ConnectorValidator.call,
                    },
                    messages: {
                      objectStrict: "RESTCallableRouteResolverSchema cannot be with other connectors",
                    },
                  };
                } else if (restProps.publish !== "undefined") {
                  rule = {
                    type: "object",
                    strict: true,
                    props: {
                      publish: ConnectorValidator.publish,
                    },
                    messages: {
                      objectStrict: "RESTPublishableRouteResolverSchema cannot be with other connectors",
                    },
                  };
                } else {
                  errors.push({
                    type: "routeInvalid",
                    field: `routes[${idx}]`,
                    message: `${method} route should have either call or publish property`,
                    expected: `Omit<RESTCallableRouteResolverSchema, "ignoreError"> | RESTPublishableRouteResolverSchema`,
                  });
                }
                break;
            }

            // @ts-ignore
            if (rule) {
              errors.push(...validateValue(restProps,
                // @ts-ignore
                rule, {
                  strict: true,
                  field: `routes[${idx}]`,
                }));
            }
            return errors;
          },
        },
      },
    }, {
      strict: true,
    });
  }

  public compileSchemata(routeHashMapCache: Readonly<Map<string, Readonly<Route>>>, integrations: Array<Readonly<ServiceAPIIntegration>>): Array<{ hash: string, route: Readonly<Route> }> {
    const items = new Array<{ hash: string, route: Readonly<Route> }>();

    for (const integration of integrations) {
      const schema: RESTProtocolPluginSchema = (integration.schema.protocol as any)[this.key];
      for (const routeSchema of schema.routes) {

        // the source object below hash contains properties which can make this route unique
        const routeHash = hashObject([schema.basePath, routeSchema, integration.service.hash], true);

        // cache hit
        const cachedRoute = routeHashMapCache.get(routeHash);
        if (cachedRoute) {
          items.push({hash: routeHash, route: cachedRoute});
          continue;
        }

        const path = HTTPRoute.mergePaths(schema.basePath, routeSchema.path);
        const method = routeSchema.method;

        let route: Readonly<Route> | undefined;
        switch (method) {
          case "GET":
            if ((routeSchema as RESTCallableRouteResolverSchema).call) {
              route = this.createRouteFromCallConnectorScheme(path, method, routeSchema as RESTCallableRouteResolverSchema, integration);
            } else if ((routeSchema as RESTMappableRouteResolverSchema).map) {
              route = this.createRouteFromMapConnectorScheme(path, method, routeSchema as RESTMappableRouteResolverSchema, integration);
            }
            break;
          default:
            if ((routeSchema as RESTCallableRouteResolverSchema).call) {
              route = this.createRouteFromCallConnectorScheme(path, method, routeSchema as RESTCallableRouteResolverSchema, integration);
            } else if ((routeSchema as RESTPublishableRouteResolverSchema).publish) {
              route = this.createRouteFromPublishConnectorScheme(path, method, routeSchema as RESTPublishableRouteResolverSchema, integration);
            }
        }

        if (route) {
          items.push({hash: routeHash, route});
        }
      }
    }

    return items;
  }

  private createRouteFromMapConnectorScheme(path: string, method: "GET", schema: RESTMappableRouteResolverSchema, integration: Readonly<ServiceAPIIntegration>): Readonly<HTTPRoute> {
    const mapConnector = ConnectorCompiler.map(schema.map, integration, {
      mappableKeys: ["context", "path", "query", "body"],
    });

    const handler: HTTPRouteHandler = (context, req, res) => {
      const {params, query, body} = req;
      const mappableArgs = {context, path: params, query, body};
      const result = mapConnector(mappableArgs);
      this.sendResponse(res, result);
    };

    return new HTTPRoute({
      path,
      method,
      description: (schema as RESTRouteSchema).description || null,
      handler,
    });
  }

  private createRouteFromCallConnectorScheme(path: string, method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE",
                                             schema: RESTCallableRouteResolverSchema, integration: Readonly<ServiceAPIIntegration>): Readonly<HTTPRoute> {
    const callConnector = ConnectorCompiler.call(schema.call, integration, this.props.policyPlugins, {
      explicitMappableKeys: ["context", "path", "query", "body"],
      implicitMappableKeys: ["path"],
      batchingEnabled: false,
      disableCache: false,
    });

    const {ignoreError} = schema;
    const multipart = new MultipartFormDataHandler(this.opts.uploads);

    const handler: HTTPRouteHandler = async (context, req, res) => {
      try {
        // process multipart/form-data
        const uploads = await multipart.collect(req, res);
        if (uploads) {
          req.body = Object.assign(req.body || {}, uploads);
        }

        const {params, query, body} = req;
        const mappableArgs = {context, path: params, query, body};
        const result = await callConnector(context, mappableArgs);
        this.sendResponse(res, result);

      } catch (error) {
        if (ignoreError) {
          this.sendResponse(res, null);
        } else {
          throw error;
        }
      }
    };

    return new HTTPRoute({
      path,
      method,
      description: (schema as RESTRouteSchema).description || null,
      handler,
    });
  }

  private createRouteFromPublishConnectorScheme(path: string, method: "POST" | "PUT" | "PATCH" | "DELETE",
                                                schema: RESTPublishableRouteResolverSchema, integration: Readonly<ServiceAPIIntegration>): Readonly<HTTPRoute> {
    const publishConnector = ConnectorCompiler.publish(schema.publish, integration, this.props.policyPlugins, {
      mappableKeys: ["context", "path", "query", "body"],
    });

    const handler: HTTPRouteHandler = async (context, req, res) => {
      const {params, query, body} = req;
      const mappableArgs = {context, path: params, query, body};
      const result = await publishConnector(context, mappableArgs);
      this.sendResponse(res, result);
    };

    return new HTTPRoute({
      path,
      method,
      description: (schema as RESTRouteSchema).description || null,
      handler,
    });
  }

  // TODO: REST plugin catalog
  public describeSchema(schema: Readonly<RESTProtocolPluginSchema>): RESTProtocolPluginCatalog {
    return {} as RESTProtocolPluginCatalog;
  }

  private sendResponse(res: HTTPRouteResponse, result: any) {
    if (result === null || typeof result === "undefined") {
      res.status(200).end();
    } else if (typeof result === "object") {
      // response header modification
      if (typeof result.$headers === "object") {
        for (const [k, v] of Object.entries(result.$headers)) {
          if (typeof k !== "string") {
            continue;
          }
          res.setHeader(k, v as any);
        }
      }

      // response code modification
      if (typeof result.$status === "number") {
        res.status(result.$status);
      }

      // streaming support
      if (typeof result.createReadStream === "function") {
        const stream = result.createReadStream() as ReadableStream;
        if (!isReadStream(stream)) {
          throw new Error("invalid read stream"); // TODO: normalize error
        }
        if (!res.hasHeader("Content-Type")) {
          res.setHeader("Content-Type", "application/octet-stream");
        }
        if (!res.hasHeader("Transfer-Encoding")) {
          res.setHeader("Transfer-Encoding", "chunked");
        }
        stream.pipe(res);
      } else {
        const { $status, $headers, ...otherProps } = result;
        res.json(otherProps);
      }
    } else {
      res.status(200).json(result);
    }
  }
}

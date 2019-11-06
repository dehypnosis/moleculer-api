import * as _ from "lodash";
import Busboy from "busboy";
import { RecursivePartial, hash, validateObject, validateValue, ValidationError, ValidationRule } from "../../../../interface";
import { ServiceAPIIntegration } from "../../../integration";
import { Route, HTTPRoute, HTTPRouteHandler, HTTPRouteRequest } from "../../../../server";
import { ProtocolPlugin, ProtocolPluginProps } from "../plugin";
import { MultipartFormDataHandler } from "./multipart";
import { RESTProtocolPluginSchema, RESTProtocolPluginCatalog, RESTCallableRouteResolverSchema, RESTMappableRouteResolverSchema, RESTPublishableRouteResolverSchema, RESTRouteSchema, RESTRouteResolverSchema } from "./schema";
import { ConnectorCompiler, ConnectorValidator } from "../../connector";

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
    const routeSigs: string[] = [];
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
              const routeSig = `${method} ${path}`;
              if (routeSigs.includes(routeSig)) {
                return [{
                  field: `routes[${idx}].path`,
                  type: "routePathDuplicate",
                  actual: routeSig,
                  expected: undefined,
                  message: `a pair of route method and path should be unique"`,
                }];
              }
              routeSigs.push(routeSig);
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
      const schema: RESTProtocolPluginSchema = integration.schema.protocol[this.key];
      for (const routeSchema of schema.routes) {

        // the source object below hash contains properties which can make this route unique
        const routeHash = hash([schema.basePath, routeSchema, integration.service.hash], true);

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
    const connector = ConnectorCompiler.map(schema.map, integration, {
      mappableKeys: ["context", "path", "query", "body"],
    });

    const handler: HTTPRouteHandler = (context, req, res) => {
      const mappableArgs = {path: req.path, query: req.query, body: req.body, context};
      const result = connector(mappableArgs);
      res.json(result);
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
    const connector = ConnectorCompiler.call(schema.call, integration, this.props.policyPlugins, {
      explicitMappableKeys: ["context", "path", "query", "body"],
      implicitMappableKeys: ["path", "query", "body"],
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

        const mappableArgs = {context, path: req.path, query: req.query, body: req.body};
        const result = await connector(context, mappableArgs);

        // TODO: [rest] suport { meta.headers } http header transformation
        // if (result && result.meta && result.meta.headers && typeof result.meta.headers === "object") {
        //   const headers = result.meta.headers;
        //   for (const k of headers) {
        //     res.setHeader(k, headers[k]);
        //   }
        // }

        // TODO: [rest] support { stream } streaming response
        // if (result && result.stream && isReadableStream(result.stream)) {
        //   res.setHeader("Transfer-Encoding", "chunked");
        //   res.send(result.stream);
        //   return;
        // }

        res.json(result);

      } catch (error) {
        if (ignoreError) {
          // integration.reporter.debug("error has been ignored for call request", error);
          res.json(null); // TODO: [format] normalize response
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
    const connector = ConnectorCompiler.publish(schema.publish, integration, this.props.policyPlugins, {
      mappableKeys: ["context", "path", "query", "body"],
    });

    const handler: HTTPRouteHandler = async (context, req, res) => {
      const mappableArgs = {context, path: req.path, query: req.query, body: req.body};
      const result = await connector(context, mappableArgs);
      res.json(result);
    };

    return new HTTPRoute({
      path,
      method,
      description: (schema as RESTRouteSchema).description || null,
      handler,
    });
  }

  // TODO: [rest] REST catalog
  public describeSchema(schema: Readonly<RESTProtocolPluginSchema>): RESTProtocolPluginCatalog {
    return {} as RESTProtocolPluginCatalog;
  }
}

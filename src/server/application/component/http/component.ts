import * as _ from "lodash";
import express from "express";
import { RecursivePartial } from "../../../../interface";
import { ContextFactoryFn } from "../../context";
import { RouteHandlerMap } from "../route";
import { ServerApplicationComponent, ServerApplicationComponentProps } from "../component";
import { HTTPRoute, HTTPRouteInternalHandler } from "./route";

export type ServerHTTPApplicationOptions = {
  trustProxy: boolean;
};

export class ServerHTTPApplication extends ServerApplicationComponent<HTTPRoute> {
  public static readonly key = "http";
  public readonly Route = HTTPRoute;
  public readonly module: express.Application;
  private readonly opts: ServerHTTPApplicationOptions;
  private readonly routeHandlerExpressRouterMap = new Map<Readonly<RouteHandlerMap<HTTPRoute>>, express.Router>();

  constructor(props: ServerApplicationComponentProps, opts?: RecursivePartial<ServerHTTPApplicationOptions>) {
    super(props);
    this.opts = _.defaultsDeep(opts || {
      trustProxy: true,
    }, {});

    // create express.Application without http.Server instance
    this.module = express();
    Object.assign(this.module.settings, {
      "env": "production",
      "case sensitive routing": false,
      "strict routing": false,
      "trust proxy": this.opts.trustProxy,
      "x-powered-by": false,
    });

    // modify use method to emit mount event
    const originalUse = this.module.use.bind(this.module);
    this.module.use = (subApp: any) => {
      const result = originalUse(subApp);
      this.module.emit("update", subApp);
      return result;
    };
  }

  /* lifecycle */
  public async start(): Promise<void> {
    // ...
  }

  public async stop(): Promise<void> {
    this.routeHandlerExpressRouterMap.clear();
  }

  public mountRoutes(routes: ReadonlyArray<Readonly<HTTPRoute>>, pathPrefixes: string[], createContext: ContextFactoryFn): Readonly<RouteHandlerMap<HTTPRoute>> {

    // create new express.Router for given routes and mount to express.Application
    const expressRouter = express.Router();
    this.module.use(expressRouter);

    // create routeHandlerMap for this routes
    const routeHandlerMap = new Map<Readonly<HTTPRoute>, HTTPRouteInternalHandler>();

    // link routeHandlerMap to express.Router for the time to unmount
    this.routeHandlerExpressRouterMap.set(routeHandlerMap, expressRouter);

    // mount each routes
    for (const route of routes) {
      let expressRouterMount = expressRouter.all;
      switch (route.method) {
        case "PATCH":
          expressRouterMount = expressRouter.patch;
          break;
        case "GET":
          expressRouterMount = expressRouter.get;
          break;
        case "DELETE":
          expressRouterMount = expressRouter.delete;
          break;
        case "POST":
          expressRouterMount = expressRouter.post;
          break;
        case "PUT":
          expressRouterMount = expressRouter.put;
          break;
        default:
          this.props.logger.error(`cannot mount route: ${route}`); // TODO: normalize error
          continue;
      }
      expressRouterMount = expressRouterMount.bind(expressRouter);

      // internal handler should extract context and pass context to external handler
      const routeHandler: HTTPRouteInternalHandler = async (req, res, next) => {
        try {
          // create context
          const context = await createContext(req);

          // req.params
          req.params = route.paramKeys.reduce((obj, key, i) => {
            obj[key.name] = req.params[i];
            return obj;
          }, {} as any);

          // call handler
          await route.handler(context, req, res);
        } catch (error) {
          next(error);
        }
      };

      // mount handler into router
      const pathRegExps = route.getPathRegExps(pathPrefixes);
      for (const regExp of pathRegExps) {
        expressRouterMount(regExp, routeHandler);
      }
      this.props.logger.debug(`${route} mounted on ${pathPrefixes.join(", ")}`);

      // store route and handler to map
      routeHandlerMap.set(route, routeHandler);
    }

    return routeHandlerMap;
  }

  public unmountRoutes(routeHandlerMap: Readonly<RouteHandlerMap<HTTPRoute>>): void {
    const expressRouter = this.routeHandlerExpressRouterMap.get(routeHandlerMap);
    if (!expressRouter) {
      this.props.logger.error(`cannot find express.Router matched for given RouteHandlerMap`, routeHandlerMap);
      return;
    }

    // unmount express.Router
    this.unmountExpressRouter(expressRouter);

    // forget the routeHandlerMap
    this.routeHandlerExpressRouterMap.delete(routeHandlerMap);
  }

  private unmountExpressRouter(expressRouter: express.Router, layers: any = this.module._router.stack) {
    for (let i = layers.length - 1; i >= 0; i--) {
      const layer = layers[i];
      if (layer.handle === expressRouter) {
        layers.splice(i, 1);
      } else if (layer.route) {
        this.unmountExpressRouter(expressRouter, layer.route.stack);
        if (layer.route.stack.length === 0) {
          layers.splice(i, 1);
        }
      }
    }
  }
}

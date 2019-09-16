import * as _ from "lodash";
import ws from "ws";
import url from "url";
import { RecursivePartial } from "../../../../interface";
import { RouteHandlerMap } from "../route";
import { ServerApplicationComponent, ServerApplicationComponentProps } from "../component";
import { WebSocketRoute, WebSocketRouteInternalHandler } from "./route";

export type ServerWebSocketApplicationOptions = Omit<ws.ServerOptions, "host" | "port" | "server" | "path" | "noServer">;

export class ServerWebSocketApplication extends ServerApplicationComponent<WebSocketRoute> {
  public static readonly key = "ws";
  public readonly Route = WebSocketRoute;
  public readonly module: ws.Server;
  private readonly opts: ServerWebSocketApplicationOptions;
  private readonly routeHandlerConnectionHandlersMap = new Map<Readonly<RouteHandlerMap<WebSocketRoute>>, ReadonlyArray<WebSocketRouteInternalHandler>>();

  constructor(props: ServerApplicationComponentProps, opts?: RecursivePartial<ServerWebSocketApplicationOptions>) {
    super(props);
    this.opts = _.defaultsDeep(opts || {
      perMessageDeflate: false,
    }, {});

    // create WebSocket.Server without http.Server instance
    this.module = new ws.Server({...this.opts, noServer: true});
  }

  public async start(): Promise<void> {
    // ...
  }

  public async stop(): Promise<void> {
    this.module.removeAllListeners();
    this.routeHandlerConnectionHandlersMap.clear();
  }

  public mountRoutes(routes: ReadonlyArray<Readonly<WebSocketRoute>>, pathPrefixes: string[], routeMatched: () => void): Readonly<RouteHandlerMap<WebSocketRoute>> {
    // create new array to store connection handlers
    const connectionHandlers: WebSocketRouteInternalHandler[] = [];

    // create routeHandlerMap for this routes
    const routeHandlerMap = new Map<Readonly<WebSocketRoute>, WebSocketRouteInternalHandler>();

    // link routeHandlerMap to express.Router for the time to unmount
    this.routeHandlerConnectionHandlersMap.set(routeHandlerMap, connectionHandlers);

    // mount each routes
    for (const route of routes) {
      // internal handler should extract context and pass context to external handler
      const pathRegExps = route.getPathRegExps(pathPrefixes);
      const routeHandler: WebSocketRouteInternalHandler = (wsSocket, req) => {
        const path = url.parse(req.url || "/").path;
        // TODO: !!!!!middleware... routeMatched(branch) and ... wsSocket.routeMatched to close socket when nothing matched..?
        if (path && pathRegExps.some(regExp => regExp.test(path))) {
          routeMatched();
          wsSocket.routeMatched = true;
          const context = req.context || {};
          route.handler(context, wsSocket, req); // normalize req params, query things
        }
      };

      // mount handler to ws.Server
      this.module.on("connection", routeHandler);
      this.props.logger.debug(`${route} mounted on ${pathPrefixes.join(", ")}`);

      // store connection handler to unmount later
      connectionHandlers.push(routeHandler);

      // store route and handler to map
      routeHandlerMap.set(route, routeHandler);
    }

    return routeHandlerMap;
  }

  public unmountRoutes(routeHandlerMap: Readonly<RouteHandlerMap<WebSocketRoute>>): void {
    const connectionHandlers = this.routeHandlerConnectionHandlersMap.get(routeHandlerMap);
    if (!connectionHandlers) {
      this.props.logger.error(`cannot find io.connectionHandlers matched for given RouteHandlerMap`, routeHandlerMap);
      return;
    }

    // unmount connection handlers
    for (const handler of connectionHandlers) {
      this.module.removeListener("connection", handler);
    }

    // forget the routeHandlerMap
    this.routeHandlerConnectionHandlersMap.delete(routeHandlerMap);
  }
}

import * as _ from "lodash";
import http from "http";
import http2 from "http2";
import net from "net";
import ws from "ws";
import url from "url";
import qs from "qs";
import { RecursivePartial } from "../../../../interface";
import { ContextFactory, ContextFactoryFn } from "../../context";
import { RouteHandlerMap } from "../route";
import { ServerApplicationComponent, ServerApplicationComponentProps } from "../component";
import { WebSocketRoute, WebSocketRouteInternalHandler } from "./route";

export type ServerWebSocketApplicationOptions = Omit<ws.ServerOptions, "host" | "port" | "server" | "path" | "noServer">;

type WebSocketUpgradeEventHandler = (req: Readonly<http.IncomingMessage> | Readonly<http2.Http2ServerRequest>, socket: net.Socket, head: Buffer) => void;

export class ServerWebSocketApplication extends ServerApplicationComponent<WebSocketRoute> {
  public static readonly key = "ws";
  public readonly Route = WebSocketRoute;
  public readonly module: ws.Server & { upgradeEventHandler: WebSocketUpgradeEventHandler };
  private readonly opts: ServerWebSocketApplicationOptions;
  private readonly routeHandlerConnectionHandlersMap = new Map<Readonly<RouteHandlerMap<WebSocketRoute>>, ReadonlyArray<WebSocketRouteInternalHandler>>();

  constructor(props: ServerApplicationComponentProps, opts?: RecursivePartial<ServerWebSocketApplicationOptions>) {
    super(props);
    this.opts = _.defaultsDeep(opts || {
      perMessageDeflate: false,
    }, {});

    // create WebSocket.Server without http.Server instance
    const wsServer = new ws.Server({...this.opts, noServer: true});

    // attach upgrade handler which will be mounted as server protocols "upgrade" event handler
    const upgradeEventHandler: WebSocketUpgradeEventHandler = (req, socket, head) => {
      // handle upgrade with ws module and emit connection to web socket
      // tslint:disable-next-line:no-shadowed-variable
      wsServer.handleUpgrade(req as any, socket, head, ws => {
        wsServer.emit("connection", ws, req);

        // trick for route websocket handlers: if context not parsed yet, assume it there are no matched handler
        setTimeout(() => {
          if (!ContextFactory.parsed(req)) {
            wsServer.emit("error", new Error("not found websocket route")); // TODO: normalize error
            ws.close();
          }
        }, 1000);
      });
    };

    this.module = Object.assign(wsServer, {upgradeEventHandler});
  }

  public async start(): Promise<void> {
    // ...
  }

  public async stop(): Promise<void> {
    this.module.removeAllListeners();
    this.routeHandlerConnectionHandlersMap.clear();
  }

  public mountRoutes(routes: ReadonlyArray<Readonly<WebSocketRoute>>, pathPrefixes: string[], createContext: ContextFactoryFn): Readonly<RouteHandlerMap<WebSocketRoute>> {
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
      // tslint:disable-next-line:no-shadowed-variable
      const routeHandler: WebSocketRouteInternalHandler = async (ws, req) => {
        const {pathname, query} = url.parse(req.url || "/");

        for (const regExp of pathRegExps) {
          const match = regExp.exec(pathname!);
          if (match) {
            // create context
            const context = await createContext(req);

            // req.params
            req.params = route.paramKeys.reduce((obj, key, i) => {
              obj[key.name] = match[i + 1];
              return obj;
            }, {} as any);

            // req.path
            req.path = pathname!;

            // req.query
            // use qs module to be along with http component: https://github.com/expressjs/express/blob/3ed5090ca91f6a387e66370d57ead94d886275e1/lib/middleware/query.js#L34
            req.query = query ? qs.parse(query, {allowPrototypes: true}) : {};

            // call handler
            route.handler(context, ws, req);
            break;
          }
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
      this.props.logger.error(`cannot find io.connectionHandlers matched for given RouteHandlerMap`, routeHandlerMap); // TODO: normalize error for all logger.error
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

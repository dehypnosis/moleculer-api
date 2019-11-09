import * as _ from "lodash";
import http from "http";
import http2 from "http2";
import net from "net";
import ws from "ws";
import url from "url";
import qs from "qs";
import { RecursivePartial } from "../../../../interface";
import { APIRequestContext, APIRequestContextConstructor } from "../../context";
import { RouteHandlerMap } from "../route";
import { ServerApplicationComponent, ServerApplicationComponentProps } from "../component";
import { WebSocketRoute, WebSocketRouteInternalHandler } from "./route";

export type ServerWebSocketApplicationOptions = Omit<ws.ServerOptions, "host" | "port" | "server" | "path" | "noServer"> & {
  contextCreationTimeout: number;
  pingPongCheckInterval: number;
};

type WebSocketUpgradeEventHandler = (req: Readonly<http.IncomingMessage> | Readonly<http2.Http2ServerRequest>, socket: net.Socket, head: Buffer) => void;

export class ServerWebSocketApplication extends ServerApplicationComponent<WebSocketRoute> {
  public static readonly key = "ws";
  public readonly Route = WebSocketRoute;
  public readonly module: ws.Server & { upgradeEventHandler: WebSocketUpgradeEventHandler };
  private readonly opts: ServerWebSocketApplicationOptions;
  private readonly routeHandlerConnectionHandlersMap = new Map<Readonly<RouteHandlerMap<WebSocketRoute>>, ReadonlyArray<WebSocketRouteInternalHandler>>();
  private pingPongCheckIntervalTimer?: NodeJS.Timeout;

  constructor(props: ServerApplicationComponentProps, opts?: RecursivePartial<ServerWebSocketApplicationOptions>) {
    super(props);
    this.opts = _.defaultsDeep(opts || {
      perMessageDeflate: false,
      clientTracking: true,
      contextCreationTimeout: 100,
      pingPongCheckInterval: 5000,
    }, {});

    const {contextCreationTimeout, pingPongCheckInterval, ...serverOpts} = this.opts;

    // create WebSocket.Server without http.Server instance
    const server = new ws.Server({...serverOpts, noServer: true});

    // attach upgrade handler which will be mounted as server protocols "upgrade" event handler
    const upgradeEventHandler: WebSocketUpgradeEventHandler = (req, tcpSocket, head) => {
      // handle upgrade with ws module and emit connection to web socket
      server.handleUpgrade(req as any, tcpSocket, head, socket => {
        // proxy socket error to server
        socket.on("error", error => {
          if (server.listenerCount("error") > 0) {
            server.emit("error", error, socket, req);
          } else {
            this.props.logger.error(error);
          }
        });

        // emit CONNECTION
        server.emit("connection", socket, req);
        if (socket.readyState !== socket.OPEN) { // close by middleware or somewhere
          return;
        }

        // trick: if context not being created yet, assume it there are no matched handler
        if (APIRequestContext.isCreating(req)) {
          // route matched, start ping-pong
          (socket as any).__isAlive = true;
          socket.on("pong", () => {
            (socket as any).__isAlive = true;
          });
        } else {
          // route not matched throw error
          const error = new Error("not found websocket route"); // TODO: normalize error
          if (server.listenerCount("error") > 0) {
            server.emit("error", error, socket, req);
          } else {
            this.props.logger.error(error);
          }
          socket.close();
        }
      });

      // TERMINATE dangling sockets
      if (this.pingPongCheckIntervalTimer) {
        clearInterval(this.pingPongCheckIntervalTimer);
      }
      this.pingPongCheckIntervalTimer = setInterval(() => {
        server.clients.forEach(socket => {
          if ((socket as any).__isAlive === true) {
            (socket as any).__isAlive = false;
            socket.ping();
          } else if ((socket as any).__isAlive === false) {
            socket.terminate();
          } else {
            // do nothing when __isAlive is undefined yet
          }
        });
      }, pingPongCheckInterval);
    };

    this.module = Object.assign(server, {upgradeEventHandler});
  }

  public async start(): Promise<void> {
    // ...
  }

  public async stop(): Promise<void> {
    if (this.pingPongCheckIntervalTimer) {
      clearInterval(this.pingPongCheckIntervalTimer);
    }
    this.module.removeAllListeners();
    this.routeHandlerConnectionHandlersMap.clear();
  }

  public mountRoutes(routes: ReadonlyArray<Readonly<WebSocketRoute>>, pathPrefixes: string[], createContext: APIRequestContextConstructor): Readonly<RouteHandlerMap<WebSocketRoute>> {
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
      const routeHandler: WebSocketRouteInternalHandler = async (socket, req) => {
        const {pathname, query} = url.parse(req.url || "/");

        for (const regExp of pathRegExps) {
          const match = regExp.exec(pathname!);
          if (match) {
            // create context
            const context = await createContext(req);
            socket.once("close", () => context.clear());

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
            route.handler(context, socket, req);
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

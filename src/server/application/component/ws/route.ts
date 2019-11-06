import { Route, RouteProps } from "../route";
import http from "http";
import http2 from "http2";
import ws from "ws";

export type WebSocketHTTPRequest = http.IncomingMessage | http2.Http2ServerRequest;
export type WebSocketRouteHandler<Context = any> = (context: Context, ws: ws, req: WebSocketHTTPRequest) => void;

/*
  WebSocketRouteInternalHandler will be attached to `wsServer.on("connection", ...)`
  But "connection" event handlers will not invoked by `wsServer.emit("connection", wsSocket)` of EventEmitter.
  To make isolated connection handling, only matched handlers by own paths will be called directly.
 */
export type WebSocketRouteInternalHandler = (ws: ws, req: WebSocketHTTPRequest) => void;

export type WebSocketRouteProps<Context = any> = Omit<RouteProps, "handler"> & {
  handler: WebSocketRouteHandler<Context>;
};

export class WebSocketRoute extends Route {
  protected readonly props: WebSocketRouteProps;

  constructor(props: Omit<WebSocketRouteProps, "protocol">) {
    const propsWithProtocol = {...props, protocol: "ws"};
    super(propsWithProtocol);
    this.props = propsWithProtocol;
  }

  public get handler(): WebSocketRouteHandler {
    return this.props.handler;
  }

  public isConflict(route: Readonly<Route>): boolean {
    return route instanceof WebSocketRoute && super.isConflict(route);
  }
}

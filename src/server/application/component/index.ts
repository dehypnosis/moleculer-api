import { ServerHTTPApplication, ServerHTTPApplicationOptions } from "./http/component";
import { ServerWebSocketApplication, ServerWebSocketApplicationOptions } from "./ws/component";

export { ServerApplicationComponent } from "./component";

export type ServerApplicationComponentConstructorOptions = {
  [ServerHTTPApplication.key]: ServerHTTPApplicationOptions;
  [ServerWebSocketApplication.key]: ServerWebSocketApplicationOptions;
};

export const ServerApplicationComponentConstructors = {
  [ServerHTTPApplication.key]: ServerHTTPApplication,
  [ServerWebSocketApplication.key]: ServerWebSocketApplication,
};

export type ServerApplicationComponentModules = {
  [ServerHTTPApplication.key]: ServerHTTPApplication["module"],
  [ServerWebSocketApplication.key]: ServerWebSocketApplication["module"],
};

export { Route, RouteHandler, RouteHandlerMap, VersionHandlerMap, BranchHandlerMap  } from "./route";
export { HTTPRoute, HTTPRouteProps, HTTPRouteHandler  } from "./http/route";
export { WebSocketRoute, WebSocketRouteHandler, WebSocketRouteProps  } from "./ws/route";

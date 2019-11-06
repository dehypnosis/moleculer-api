import { ServerHTTPApplication, ServerHTTPApplicationOptions } from "./http/component";
import { ServerWebSocketApplication, ServerWebSocketApplicationOptions } from "./ws/component";

export { ServerApplicationComponent } from "./component";
export * from "./route";
export * from "./http/route";
export * from "./ws/route";

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

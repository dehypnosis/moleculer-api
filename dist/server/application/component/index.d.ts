import { ServerHTTPApplication, ServerHTTPApplicationOptions } from "./http/component";
import { ServerWebSocketApplication, ServerWebSocketApplicationOptions } from "./ws/component";
export { ServerApplicationComponent } from "./component";
export * from "./route";
export * from "./http/route";
export * from "./ws/route";
export declare type ServerApplicationComponentConstructorOptions = {
    [ServerHTTPApplication.key]: ServerHTTPApplicationOptions;
    [ServerWebSocketApplication.key]: ServerWebSocketApplicationOptions;
};
export declare const ServerApplicationComponentConstructors: {
    http: typeof ServerHTTPApplication;
    ws: typeof ServerWebSocketApplication;
};
export declare type ServerApplicationComponentModules = {
    [ServerHTTPApplication.key]: ServerHTTPApplication["module"];
    [ServerWebSocketApplication.key]: ServerWebSocketApplication["module"];
};

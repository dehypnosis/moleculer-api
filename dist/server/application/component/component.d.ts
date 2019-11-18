import { HasStaticKey } from "../../../interface";
import { Logger } from "../../../logger";
import { APIRequestContextConstructor } from "../context";
import { Route, RouteHandlerMap } from "./route";
export declare type ServerApplicationComponentProps = {
    logger: Logger;
};
export declare abstract class ServerApplicationComponent<ApplicationRoute extends Route> extends HasStaticKey {
    protected readonly props: ServerApplicationComponentProps;
    constructor(props: ServerApplicationComponentProps, opts?: any);
    abstract readonly Route: new (...args: any[]) => ApplicationRoute;
    abstract readonly module: any;
    toString(): string;
    canHandleRoute(route: Readonly<Route>): boolean;
    abstract unmountRoutes(routeHandlerMap: Readonly<RouteHandlerMap<ApplicationRoute>>): void;
    abstract mountRoutes(routes: ReadonlyArray<Readonly<ApplicationRoute>>, pathPrefixes: string[], createContext: APIRequestContextConstructor): Readonly<RouteHandlerMap<ApplicationRoute>>;
    abstract start(): Promise<void>;
    abstract stop(): Promise<void>;
}

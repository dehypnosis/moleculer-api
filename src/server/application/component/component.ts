import * as kleur from "kleur";
import { HasStaticKey } from "../../../interface";
import { Logger } from "../../../logger";
import { Route, RouteHandlerMap } from "./route";

export type ServerApplicationComponentProps = {
  logger: Logger;
};

export abstract class ServerApplicationComponent<ApplicationRoute extends Route> extends HasStaticKey {
  constructor(protected readonly props: ServerApplicationComponentProps, opts?: any) {
    super();
  }

  public abstract readonly Route: new (...args: any[]) => ApplicationRoute;
  public abstract readonly module: any; // dependant module which is injected to middleware

  public toString(): string {
    return kleur.yellow(`${this.key}<${this.Route.name}>`);
  }

  public canHandleRoute(route: Readonly<Route>): boolean {
    return route instanceof this.Route;
  }

  public abstract unmountRoutes(routeHandlerMap: Readonly<RouteHandlerMap<ApplicationRoute>>): void;

  public abstract mountRoutes(routes: ReadonlyArray<Readonly<ApplicationRoute>>, pathPrefixes: string[], routeMatched: () => void): Readonly<RouteHandlerMap<ApplicationRoute>>;

  public abstract async start(): Promise<void>;

  public abstract async stop(): Promise<void>;
}

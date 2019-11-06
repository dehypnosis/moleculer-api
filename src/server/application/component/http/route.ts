import * as kleur from "kleur";
import { Route, RouteProps } from "../route";
import express from "express-serve-static-core";
export type HTTPRouteRequest = express.Request;
export type HTTPRouteResponse = express.Response;
export type HTTPRouteHandler<Context = any> = (context: Context, req: HTTPRouteRequest, res: HTTPRouteResponse) => void | Promise<void>;
export type HTTPRouteInternalHandler = (req: HTTPRouteRequest, res: HTTPRouteResponse, next: express.NextFunction) => void;

export type HTTPRouteProps<Context = any> = Omit<RouteProps, "handler"> & {
  handler: HTTPRouteHandler<Context>;
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
};

export class HTTPRoute extends Route {
  protected readonly props: HTTPRouteProps;

  constructor(props: Omit<HTTPRouteProps, "protocol">) {
    const propsWithProtocol = {...props, protocol: "http"};
    super(propsWithProtocol);
    this.props = propsWithProtocol;
  }

  public get method() {
    return this.props.method;
  }

  public get handler(): HTTPRouteHandler {
    return this.props.handler;
  }

  public isConflict(route: Readonly<Route>): boolean {
    return route instanceof HTTPRoute && route.method === this.method && super.isConflict(route);
  }

  public toString(): string {
    return kleur.cyan(`${this.path} (${this.protocol}:${this.method})${this.props.description ? ": " + kleur.dim(this.props.description) : ""}`);
  }
}

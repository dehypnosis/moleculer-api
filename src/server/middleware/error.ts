import * as _ from "lodash";
import { RecursivePartial } from "../../interface";
import { HTTPRouteNextFn, HTTPRouteRequest, HTTPRouteResponse, ServerApplicationComponentModules } from "../application/component";
import { ServerMiddleware, ServerMiddlewareProps } from "./middleware";

export type ErrorMiddlewareOptions = {
  displayErrorStack: boolean;
  responseFormat: (obj: any) => any;
};

/*
  Uncaught Error handling middleware
*/

export class ErrorMiddleware extends ServerMiddleware {
  public static readonly key = "error";
  public static readonly autoLoadOptions = {
    displayErrorStack: true,
  };
  private readonly opts: ErrorMiddlewareOptions;

  constructor(protected readonly props: ServerMiddlewareProps, opts?: RecursivePartial<ErrorMiddlewareOptions>) {
    super(props);
    this.opts = _.defaultsDeep(opts || {}, ErrorMiddleware.autoLoadOptions);
  }

  public apply(modules: ServerApplicationComponentModules): void {
    /* HTTP Error & Not Found handling */
    const httpNotFoundHandler = this.handleHTTPNotFound.bind(this);
    const httpErrorHandler = this.handleHTTPError.bind(this);

    // arrange error handler to the last or stack on any sub app mounts
    // ref: http://expressjs.com/en/guide/error-handling.html
    const arrangeHTTPErrorHandlers = () => {
      const layers = modules.http._router.stack;

      // not found handler should be the last-1 layer
      const notFoundHandlerIndex = layers.findIndex((layer: any) => layer.handle === httpNotFoundHandler);
      console.assert(notFoundHandlerIndex !== -1, "where the http not found handler gone?");
      layers.push(...layers.splice(notFoundHandlerIndex, 1));

      // error handler should be the last layer
      const errorHandlerIndex = layers.findIndex((layer: any) => layer.handle === httpErrorHandler);
      console.assert(errorHandlerIndex !== -1, "where the http error handler gone?");
      layers.push(...layers.splice(errorHandlerIndex, 1));
    };
    modules.http.on("update", arrangeHTTPErrorHandlers);

    // mount handlers
    modules.http.use(httpNotFoundHandler);
    modules.http.use(httpErrorHandler);
    arrangeHTTPErrorHandlers();

    /* WebSocket Server Error handling */
    modules.ws.on("error", this.handleWebSocketError.bind(this));
  }

  private handleHTTPError(error: any, req: HTTPRouteRequest, res: HTTPRouteResponse, next: HTTPRouteNextFn): void {
    const {responseFormat, displayErrorStack} = this.opts;
    this.props.logger.error(error);

    if (res.headersSent) {
      return next(error);
    }

    let value: any = error;
    if (typeof error === "object" && error !== null) {
      const obj: any = {};
      for (const key of Object.getOwnPropertyNames(error)) {
        if (key !== "stack" || displayErrorStack) {
          obj[key] = error[key];
        }
      }
      value = obj;
    }

    if (responseFormat) {
      try {
        value = responseFormat(value);
      } catch (error) {
        this.props.logger.error(error);
      }
    }

    res.status(500).json(value);
  }

  private handleHTTPNotFound(req: HTTPRouteRequest, res: HTTPRouteResponse, next: HTTPRouteNextFn): void {
    res.status(404).end();
  }

  private handleWebSocketError(error: any): void {
    this.props.logger.error(error);
  }
}

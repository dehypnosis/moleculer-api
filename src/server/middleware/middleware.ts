import { Pluggable } from "../../interface";
import { Logger } from "../../logger";
import { ServerApplicationComponentModules } from "../application/component";

export type ServerMiddlewareProps = {
  logger: Logger;
};

export abstract class ServerMiddleware extends Pluggable {
  constructor(protected readonly props: ServerMiddlewareProps, opts?: any) {
    super();
  }

  public abstract apply(modules: ServerApplicationComponentModules): void;
}

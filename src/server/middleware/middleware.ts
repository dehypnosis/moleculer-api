import * as kleur from "kleur";
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

  public toString(): string {
    return kleur.yellow(this.key);
  }

  public abstract apply(modules: ServerApplicationComponentModules): void;
}

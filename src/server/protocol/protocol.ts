import * as kleur from "kleur";
import { Pluggable } from "../../interface";
import { Logger } from "../../logger";
import { ServerApplicationComponentModules } from "../application";

export type ServerProtocolProps = {
  logger: Logger;
};

export type listeningURI = string;

export abstract class ServerProtocol extends Pluggable {
  constructor(protected readonly props: ServerProtocolProps, opts?: any) {
    super();
  }

  public toString(): string {
    return kleur.yellow(this.key);
  }

  // may return bound host and listening port include protocol scheme
  public abstract start(modules: ServerApplicationComponentModules): Promise<listeningURI[]>;

  public abstract stop(): Promise<void>;
}

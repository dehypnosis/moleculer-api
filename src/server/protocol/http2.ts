import * as _ from "lodash";
import { RecursivePartial } from "../../interface";
import { ServerProtocol, ServerProtocolProps } from "./protocol";

export type ServerHTTP2ProtocolOptions = {};

export class ServerHTTP2Protocol extends ServerProtocol {
  public static readonly key = "http2";
  public static readonly autoLoadOptions = false; // disabled as default
  private readonly opts: ServerHTTP2ProtocolOptions;

  constructor(props: ServerProtocolProps, opts?: RecursivePartial<ServerHTTP2ProtocolOptions>) {
    super(props);
    this.opts = _.defaultsDeep(opts || {}, {});
  }

  // TODO: HTTP2
  public async start(): Promise<string[]> {
    throw new Error("not implemented");
  }

  public async stop(): Promise<void> {
    throw new Error("not implemented");
  }
}

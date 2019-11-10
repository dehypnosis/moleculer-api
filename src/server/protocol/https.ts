import * as https from "https";
import * as _ from "lodash";
import tls from "tls";
import { RecursivePartial } from "../../interface";
import { ServerApplicationComponentModules } from "../application";
import { listeningURI, ServerProtocol, ServerProtocolProps } from "./protocol";

export type ServerHTTPSProtocolOptions = {
  port: number;
  hostname: string;
} & tls.SecureContextOptions;

export class ServerHTTPSProtocol extends ServerProtocol {
  public static readonly key = "https";
  public static readonly autoLoadOptions = false;
  private readonly opts: ServerHTTPSProtocolOptions;
  private server?: https.Server;

  constructor(props: ServerProtocolProps, opts?: RecursivePartial<ServerHTTPSProtocolOptions>) {
    super(props);
    this.opts = _.defaultsDeep(opts || {}, {
      port: 443,
      hostname: "0.0.0.0",
    });
  }

  public async start(modules: ServerApplicationComponentModules): Promise<listeningURI[]> {
    const {port, hostname, ...tlsOpts} = this.opts;

    if (!tlsOpts.key || !tlsOpts.cert) {
      throw new Error("cannot run https protocol without key, cert file"); // TODO: normalize error
    }
    // mount http module
    this.server = https.createServer(tlsOpts, modules.http);

    // mount ws module
    this.server.on("upgrade", modules.ws.upgradeEventHandler);

    // listen
    this.server.listen(port, hostname);
    return [
      `https://${hostname}:${port}`,
      `wss://${hostname}:${port}`,
    ];
  }

  public async stop(): Promise<void> {
    if (this.server) {
      this.server.close();
    }
  }
}

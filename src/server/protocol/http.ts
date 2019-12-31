import * as http from "http";
import * as _ from "lodash";
import { RecursivePartial } from "../../interface";
import { ServerApplicationComponentModules } from "../application";
import { listeningURI, ServerProtocol, ServerProtocolProps } from "./protocol";

export type ServerHTTPProtocolOptions = {
  port: number;
  hostname: string;
};

export class ServerHTTPProtocol extends ServerProtocol {
  public static readonly key = "http";
  public static readonly autoLoadOptions: ServerHTTPProtocolOptions = {
    port: 8080,
    hostname: "localhost",
  };
  private readonly opts: ServerHTTPProtocolOptions;
  private server?: http.Server;

  constructor(props: ServerProtocolProps, opts?: RecursivePartial<ServerHTTPProtocolOptions>) {
    super(props);
    this.opts = _.defaultsDeep(opts || {}, ServerHTTPProtocol.autoLoadOptions);
  }

  public async start(modules: ServerApplicationComponentModules): Promise<listeningURI[]> {
    const { port, hostname } = this.opts;

    // mount http module
    this.server = http.createServer(modules.http);

    // mount ws module
    this.server.on("upgrade", modules.ws.upgradeEventHandler);

    // listen
    this.server.listen(port, hostname);
    return [
      `http://${hostname}:${port}`,
      `ws://${hostname}:${port}`,
    ];
  }

  public async stop(): Promise<void> {
    if (this.server) {
      this.server.close();
    }
  }
}

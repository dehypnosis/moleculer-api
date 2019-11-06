import * as http from "http";
import * as _ from "lodash";
import { RecursivePartial } from "../../interface";
import { ContextFactory, ServerApplicationComponentModules } from "../application";
import { listeningURI, ServerProtocol, ServerProtocolProps } from "./protocol";

export type ServerHTTPProtocolOptions = {
  port: number;
  hostname: string;
};

export class ServerHTTPProtocol extends ServerProtocol {
  public static readonly key = "http";
  public static readonly autoLoadOptions: ServerHTTPProtocolOptions = {
    port: 8080,
    hostname: "0.0.0.0",
  };
  private readonly opts: ServerHTTPProtocolOptions;
  private server?: http.Server;

  constructor(props: ServerProtocolProps, opts?: RecursivePartial<ServerHTTPProtocolOptions>) {
    super(props);
    this.opts = _.defaultsDeep(opts || {}, ServerHTTPProtocol.autoLoadOptions);
  }

  public async start(modules: ServerApplicationComponentModules): Promise<listeningURI[]> {
    // mount http module
    this.server = http.createServer(modules.http);

    // handle upgrade with ws module and emit connection to web socket
    this.server.on("upgrade", (req, socket, head) => {
      modules.ws.handleUpgrade(req, socket, head, ws => {
        modules.ws.emit("connection", ws, req);

        /* trick for route websocket handlers:
        * if context not parsed yet, assume it there are no matched handler
        */
        setTimeout(() => {
          if (!ContextFactory.parsed(req.headers)) {
            ws.close();
          }
        }, 1000);
      });
    });

    this.server.listen(this.opts.port, this.opts.hostname);
    return [
      `http://${this.opts.hostname}:${this.opts.port}`,
      `ws://${this.opts.hostname}:${this.opts.port}`,
    ];
  }

  public async stop(): Promise<void> {
    if (this.server) {
      this.server.close();
    }
  }
}

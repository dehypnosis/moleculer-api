import * as _ from "lodash";
import { RecursivePartial, ValidationError } from "../../../../interface";
import { ServiceAPIIntegration } from "../../../integration";
import { Route } from "../../../../server";
import { ProtocolPlugin, ProtocolPluginProps } from "../plugin";
import { WebSocketProtocolPluginSchema, WebSocketProtocolPluginCatalog } from "./schema";

export type WebSocketProtocolPluginOptions = {
};

export class WebSocketProtocolPlugin extends ProtocolPlugin<WebSocketProtocolPluginSchema, WebSocketProtocolPluginCatalog> {
  public static readonly key = "WebSocket";
  public static readonly autoLoadOptions: WebSocketProtocolPluginOptions = {
  };
  private opts: WebSocketProtocolPluginOptions;

  constructor(protected readonly props: ProtocolPluginProps, opts?: RecursivePartial<WebSocketProtocolPluginOptions>) {
    super(props);
    this.opts = _.defaultsDeep(opts || {}, WebSocketProtocolPlugin.autoLoadOptions);
  }

  public async start(): Promise<void> {
  }

  public async stop(): Promise<void> {
  }

  // TODO: WebSocket plugin
  public validateSchema(schema: Readonly<WebSocketProtocolPluginSchema>): ValidationError[] {
    return [];
  }

  public compileSchemata(routeHashMapCache: Readonly<Map<string, Readonly<Route>>>, integrations: Array<Readonly<ServiceAPIIntegration>>): Array<{ hash: string; route: Readonly<Route>; }> {
    return [];
  }

  public describeSchema(schema: Readonly<WebSocketProtocolPluginSchema>): WebSocketProtocolPluginCatalog {
    return {} as WebSocketProtocolPluginCatalog;
  }
}

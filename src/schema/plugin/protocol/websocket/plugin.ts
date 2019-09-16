import * as _ from "lodash";
import { RecursivePartial, ValidationError } from "../../../../interface";
import { ServiceAPIIntegration } from "../../../integration";
import { Route } from "../../../../server";
import { ProtocolPlugin, ProtocolPluginProps } from "../plugin";

export type WebSocketProtocolPluginOptions = {
};

export class WebSocketProtocolPlugin extends ProtocolPlugin<any, any> {
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

  // TODO: [websocket] design websocket schema
  public validateSchema(schema: Readonly<any>): ValidationError[] {
    return [];
  }

  // TODO: [websocket] websocket compile
  public compileSchemata(routeHashMapCache: Readonly<Map<string, Readonly<Route>>>, integrations: Array<Readonly<ServiceAPIIntegration>>): Array<{ hash: string; route: Readonly<Route>; }> {
    return [];
  }

  // TODO: [websocket] websocket catalog
  public describeSchema(schema: Readonly<any>): any {
    return {};
  }
}

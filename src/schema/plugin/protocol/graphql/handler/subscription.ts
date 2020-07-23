import { SubscriptionServer, ServerOptions as SubscriptionServerOptions, ConnectionContext, GRAPHQL_WS, GRAPHQL_SUBSCRIPTIONS, ExecuteFunction, SubscribeFunction } from "subscriptions-transport-ws";
import MessageTypes from "subscriptions-transport-ws/dist/message-types";
import { GraphQLSchema, specifiedRules, ValidationContext } from "graphql";
import * as WebSocket from "ws";
import { WebSocketRouteHandler } from "../../../../../server";

/*
* will not extends SubscriptionServer, copy prototype and modify constructor to detach ws.Server implementation
* ref: https://github.com/apollographql/subscriptions-transport-ws/blob/ad169f57d7b4630855e1aac06dd4d34875fa8721/src/server.ts#L117
*/

// tslint:disable:ban-types
export class GraphQLSubscriptionHandler {
  public readonly handler: WebSocketRouteHandler;

  private onOperation?: Function;
  private onOperationComplete?: Function;
  private onConnect?: Function;
  private onDisconnect?: Function;
  private keepAlive?: number;
  private execute?: ExecuteFunction;
  private subscribe?: SubscribeFunction;
  private schema?: GraphQLSchema;
  private rootValue?: any;
  private closeHandler?: () => void;
  private specifiedRules:
    ((context: ValidationContext) => any)[] |
    ReadonlyArray<any>;

  constructor(options: SubscriptionServerOptions) {
    const {
      onOperation, onOperationComplete, onConnect, onDisconnect, keepAlive,
    } = options;

    this.specifiedRules = options.validationRules || specifiedRules;
    this.loadExecutor(options);
    this.onOperation = onOperation;
    this.onOperationComplete = onOperationComplete;
    this.onConnect = onConnect;
    this.onDisconnect = onDisconnect;
    this.keepAlive = keepAlive;

    const connectionHandler: WebSocketRouteHandler = (context, socket, request) => {
      // Add `upgradeReq` to the socket object to support old API, without creating a memory leak
      // See: https://github.com/websockets/ws/pull/1099
      (socket as any).upgradeReq = request;
      // NOTE: the old GRAPHQL_SUBSCRIPTIONS protocol support should be removed in the future
      if (socket.protocol === undefined ||
        (socket.protocol.indexOf(GRAPHQL_WS) === -1 && socket.protocol.indexOf(GRAPHQL_SUBSCRIPTIONS) === -1)) {
        // Close the connection with an error code, ws v2 ensures that the
        // connection is cleaned up even when the closing handshake fails.
        // 1002: protocol error
        socket.close(1002);
        return;
      }


      const connectionContext: ConnectionContext = Object.create(null);
      connectionContext.initPromise = Promise.resolve(context);
      connectionContext.isLegacy = false;
      connectionContext.socket = socket as any;
      connectionContext.request = request as any;
      connectionContext.operations = {};

      const connectionClosedHandler = (error: any) => {
        if (error) {
          this.sendError(
            connectionContext,
            "",
            {message: error.message ? error.message : error},
            MessageTypes.GQL_CONNECTION_ERROR,
          );

          setTimeout(() => {
            // 1011 is an unexpected condition prevented the request from being fulfilled
            connectionContext.socket.close(1011);
          }, 10);
        }
        this.onClose(connectionContext);

        if (this.onDisconnect) {
          this.onDisconnect(socket, connectionContext);
        }
      };

      socket.on("error", connectionClosedHandler);
      socket.on("close", connectionClosedHandler);
      socket.on("message", this.onMessage(connectionContext));
    };

    this.handler = connectionHandler.bind(this);
  }

  public close(): void {
    throw new Error("unexpected access");
  }

  public get server(): WebSocket.Server {
    throw new Error("unexpected access");
  }

  // @ts-ignore
  private loadExecutor = SubscriptionServer.prototype.loadExecutor;
  // @ts-ignore
  private unsubscribe = SubscriptionServer.prototype.unsubscribe;
  // @ts-ignore
  private onClose = SubscriptionServer.prototype.onClose;
  // @ts-ignore
  private onMessage = SubscriptionServer.prototype.onMessage;
  // @ts-ignore
  private sendKeepAlive = SubscriptionServer.prototype.sendKeepAlive;
  // @ts-ignore
  private sendMessage = SubscriptionServer.prototype.sendMessage;
  // @ts-ignore
  private sendError = SubscriptionServer.prototype.sendError;
}

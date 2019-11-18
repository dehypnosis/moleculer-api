"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const subscriptions_transport_ws_1 = require("subscriptions-transport-ws");
const message_types_1 = tslib_1.__importDefault(require("subscriptions-transport-ws/dist/message-types"));
const graphql_1 = require("graphql");
/*
* will not extends SubscriptionServer, copy prototype and modify constructor to detach ws.Server implementation
* ref: https://github.com/apollographql/subscriptions-transport-ws/blob/ad169f57d7b4630855e1aac06dd4d34875fa8721/src/server.ts#L117
*/
// tslint:disable:ban-types
class GraphQLSubscriptionHandler {
    constructor(options) {
        // @ts-ignore
        this.loadExecutor = subscriptions_transport_ws_1.SubscriptionServer.prototype.loadExecutor;
        // @ts-ignore
        this.unsubscribe = subscriptions_transport_ws_1.SubscriptionServer.prototype.unsubscribe;
        // @ts-ignore
        this.onClose = subscriptions_transport_ws_1.SubscriptionServer.prototype.onClose;
        // @ts-ignore
        this.onMessage = subscriptions_transport_ws_1.SubscriptionServer.prototype.onMessage;
        // @ts-ignore
        this.sendKeepAlive = subscriptions_transport_ws_1.SubscriptionServer.prototype.sendKeepAlive;
        // @ts-ignore
        this.sendMessage = subscriptions_transport_ws_1.SubscriptionServer.prototype.sendMessage;
        // @ts-ignore
        this.sendError = subscriptions_transport_ws_1.SubscriptionServer.prototype.sendError;
        const { onOperation, onOperationComplete, onConnect, onDisconnect, keepAlive, } = options;
        this.specifiedRules = options.validationRules || graphql_1.specifiedRules;
        this.loadExecutor(options);
        this.onOperation = onOperation;
        this.onOperationComplete = onOperationComplete;
        this.onConnect = onConnect;
        this.onDisconnect = onDisconnect;
        this.keepAlive = keepAlive;
        const connectionHandler = (context, socket, request) => {
            // Add `upgradeReq` to the socket object to support old API, without creating a memory leak
            // See: https://github.com/websockets/ws/pull/1099
            socket.upgradeReq = request;
            // NOTE: the old GRAPHQL_SUBSCRIPTIONS protocol support should be removed in the future
            if (socket.protocol === undefined ||
                (socket.protocol.indexOf(subscriptions_transport_ws_1.GRAPHQL_WS) === -1 && socket.protocol.indexOf(subscriptions_transport_ws_1.GRAPHQL_SUBSCRIPTIONS) === -1)) {
                // Close the connection with an error code, ws v2 ensures that the
                // connection is cleaned up even when the closing handshake fails.
                // 1002: protocol error
                socket.close(1002);
                return;
            }
            const connectionContext = Object.create(null);
            connectionContext.initPromise = Promise.resolve(true);
            connectionContext.isLegacy = false;
            connectionContext.socket = socket;
            connectionContext.request = request;
            connectionContext.operations = {};
            const connectionClosedHandler = (error) => {
                if (error) {
                    this.sendError(connectionContext, "", { message: error.message ? error.message : error }, message_types_1.default.GQL_CONNECTION_ERROR);
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
    close() {
        throw new Error("unexpected access");
    }
    get server() {
        throw new Error("unexpected access");
    }
}
exports.GraphQLSubscriptionHandler = GraphQLSubscriptionHandler;
//# sourceMappingURL=subscription.js.map
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.defaultProtocolPluginConstructorOptions = exports.ProtocolPluginConstructors = void 0;
const tslib_1 = require("tslib");
const graphql_1 = require("./graphql");
const rest_1 = require("./rest");
const websocket_1 = require("./websocket");
tslib_1.__exportStar(require("./plugin"), exports);
tslib_1.__exportStar(require("./graphql"), exports);
tslib_1.__exportStar(require("./rest"), exports);
tslib_1.__exportStar(require("./websocket"), exports);
exports.ProtocolPluginConstructors = {
    [graphql_1.GraphQLProtocolPlugin.key]: graphql_1.GraphQLProtocolPlugin,
    [rest_1.RESTProtocolPlugin.key]: rest_1.RESTProtocolPlugin,
    [websocket_1.WebSocketProtocolPlugin.key]: websocket_1.WebSocketProtocolPlugin,
};
exports.defaultProtocolPluginConstructorOptions = {
    [graphql_1.GraphQLProtocolPlugin.key]: graphql_1.GraphQLProtocolPlugin.autoLoadOptions,
    [rest_1.RESTProtocolPlugin.key]: rest_1.RESTProtocolPlugin.autoLoadOptions,
    [websocket_1.WebSocketProtocolPlugin.key]: websocket_1.WebSocketProtocolPlugin.autoLoadOptions,
};
//# sourceMappingURL=index.js.map
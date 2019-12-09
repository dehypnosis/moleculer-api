"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const __1 = require("../../");
const moleculer_qmit_1 = require("moleculer-qmit");
const config_1 = require("./config");
const { isDebug, isDev } = config_1.config;
exports.gateway = new __1.APIGateway({
    brokers: [
        {
            moleculer: moleculer_qmit_1.createBrokerOptions(),
        },
    ],
    schema: {
        branch: {
            maxVersions: 10,
            maxUnusedSeconds: 60 * 10,
        },
        protocol: {
            GraphQL: {
                playground: isDev,
                introspection: true,
                debug: isDebug,
            },
        },
    },
    logger: {
        winston: {
            level: isDebug ? "debug" : "info",
        },
    },
    server: {
        application: {
            http: {
                trustProxy: true,
            },
            ws: {
                pingPongCheckInterval: 5000,
            },
        },
        protocol: {
            http: {
                port: 8080,
                hostname: "0.0.0.0",
            },
        },
        middleware: {
            cors: {
                origin: true,
                disableForWebSocket: false,
            },
            error: {
                displayErrorStack: isDev,
            },
        },
    },
});
//# sourceMappingURL=gateway.js.map
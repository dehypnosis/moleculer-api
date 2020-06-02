"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.gateway = void 0;
const tslib_1 = require("tslib");
const url_1 = tslib_1.__importDefault(require("url"));
const qmit_sdk_1 = require("qmit-sdk");
const config_1 = require("./config");
const __1 = require("../../");
const server_1 = require("../../server");
const { oidc, isDebug, isDev } = config_1.config;
exports.gateway = new __1.APIGateway({
    brokers: [
        {
            moleculer: qmit_sdk_1.moleculer.createServiceBrokerOptions({
                tracing: {
                    // TODO: dig into what causes GC crash for stopping broker when tracing enabled...
                    enabled: false,
                },
            }),
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
        context: {
            auth: {
                parser: server_1.createAuthContextOIDCParser(oidc),
                impersonator: (source, auth, logger) => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
                    if (auth.identity && auth.identity.impersonator === true && source.url) {
                        const parsedURL = url_1.default.parse(source.url, true);
                        if (parsedURL.query.impersonation) {
                            auth.identity._impersonator_sub = auth.identity.sub;
                            auth.identity.sub = parsedURL.query.impersonation;
                            logger.warn(`${auth.identity._impersonator_sub}:${auth.identity.email} has impersonated as ${auth.identity.sub}`);
                        }
                    }
                }),
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
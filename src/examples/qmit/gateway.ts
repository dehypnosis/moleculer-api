import { createBrokerOptions } from "moleculer-qmit";
import { config } from "./config";
import { APIGateway, createAuthContextOIDCParser } from "../../";

const { isDebug, isDev } = config;

export const gateway = new APIGateway({
  brokers: [
    {
      moleculer: createBrokerOptions(),
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
        parser: createAuthContextOIDCParser({
          issuer: "https://account.dev.qmit.pro",
          client_id: "test",
          client_secret: "3322b0c4c46443c88770041d05531dc994c8121d36ee4a21928c8626b09739d7",
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

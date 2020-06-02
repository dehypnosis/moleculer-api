import url from "url";
import { moleculer } from "qmit-sdk";
import { config } from "./config";
import { APIGateway, Logger } from "../../";
import { APIRequestContextSource, AuthContext, createAuthContextOIDCParser } from "../../server";

const { oidc, isDebug, isDev } = config;

export const gateway = new APIGateway({
  brokers: [
    {
      moleculer: moleculer.createServiceBrokerOptions({
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
        parser: createAuthContextOIDCParser(oidc),
        impersonator: async (source: APIRequestContextSource, auth: AuthContext, logger: Logger) => {
          if (auth.identity && auth.identity.impersonator === true && source.url) {
            const parsedURL = url.parse(source.url, true);
            if (parsedURL.query.impersonation) {
              auth.identity._impersonator_sub = auth.identity.sub;
              auth.identity.sub = parsedURL.query.impersonation;
              logger.warn(`${auth.identity._impersonator_sub}:${auth.identity.email} has impersonated as ${auth.identity.sub}`);
            }
          }
        },
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

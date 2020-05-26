import { context, vault } from "qmit-sdk";

// create global configuration
// can fetch vault secrets in local/kubernetes environment

/* istanbul ignore next */
export const config = vault.fetch(async (get, list, { appEnv }) => {
  return {
    env: appEnv,
    isDev: appEnv === "dev",
    isDebug: !!process.env.APP_DEBUG,
    ...((await get(`${appEnv}/data/api-gateway`)).data as {
      oidc: {
        issuer: string,
        client_id: string,
        client_secret: string,
      };
    }),
    // example: (await get("common/data/test")).data,
  };
}, {
  sandbox: {
    appEnv: context.appEnv,
    abc: 1234,
  },
});

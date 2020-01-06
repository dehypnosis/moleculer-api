import vault from "vault-sync";

// create global configuration
// can fetch vault secrets in local/kubernetes environment
/* istanbul ignore next */
export const config = vault(async (get, list) => {
  const env = process.env.APP_ENV || "dev";

  return {
    env,
    isDev: env === "dev",
    isDebug: !!process.env.APP_DEBUG,
    ...((await get(`${env}/data/api-gateway`)).data as {
      oidc: {
        issuer: string,
        client_id: string,
        client_secret: string,
      };
    }),
    // example: (await get("common/data/test")).data,
  };
}, {
  uri: "https://vault.internal.qmit.pro",
  method: `k8s/${process.env.APP_K8S_CLUSTER || "dev"}`,
  role: "default",
});

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createAuthContextOIDCParser = void 0;
const tslib_1 = require("tslib");
const openid_client_1 = require("openid-client");
exports.createAuthContextOIDCParser = (opts) => {
    /* setup OIDC client and auth context parser */
    let oidcIssuer;
    let oidcClient;
    let discoverError;
    function discoverIssuer() {
        openid_client_1.Issuer.discover(opts.issuer)
            .then(result => {
            oidcIssuer = result;
            discoverError = undefined;
            oidcClient = new oidcIssuer.Client({ client_id: opts.client_id, client_secret: opts.client_secret });
        })
            .catch(err => {
            discoverError = err;
        });
        // refresh issuer info for every 10min
        setTimeout(() => {
            discoverIssuer();
        }, 1000 * 60 * 10);
    }
    discoverIssuer();
    return (token, logger) => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
        if (!oidcClient) {
            logger.error(`failed to connect to OIDC provider: ${opts.issuer}`, discoverError);
            return;
        }
        let user;
        let scope;
        let client;
        let maxAge;
        // get user
        if (token && token.scheme === "Bearer" && typeof token.token === "string") {
            yield oidcClient.userinfo(token.token)
                .then(res => {
                user = res;
            })
                .catch(error => {
                const err = new Error(error.message); // TODO: normalize error
                err.status = 401;
                throw err;
            });
        }
        // get client and scope
        if (token && token.scheme === "Bearer" && typeof token.token === "string") {
            yield oidcClient.introspect(token.token)
                .then(res => {
                // console.log(res);
                client = res.client_id;
                scope = res.scope.split(" ");
                maxAge = Math.floor(1577791463 * 1000 - new Date().getTime());
            })
                .catch(error => {
                const err = new Error(error.message); // TODO: normalize error
                err.status = 401;
                throw err;
            });
        }
        return { user, scope, client, maxAge };
    });
};
//# sourceMappingURL=auth.preset.js.map
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
const tslib_1 = require("tslib");
const qmit_sdk_1 = require("qmit-sdk");
// create global configuration
// can fetch vault secrets in local/kubernetes environment
/* istanbul ignore next */
exports.config = qmit_sdk_1.vault.fetch((get, list, { appEnv }) => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
    return Object.assign({ env: appEnv, isDev: appEnv === "dev", isDebug: !!process.env.APP_DEBUG }, (yield get(`${appEnv}/data/api-gateway`)).data);
}), {
    sandbox: {
        appEnv: qmit_sdk_1.context.appEnv,
        abc: 1234,
    },
});
//# sourceMappingURL=config.js.map
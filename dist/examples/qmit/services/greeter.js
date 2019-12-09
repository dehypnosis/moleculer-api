"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const greeter_api_1 = require("./greeter.api");
exports.GreeterServiceSchema = {
    name: "greeter",
    metadata: {
        api: greeter_api_1.GreeterServiceAPISchema,
    },
    /**
     * Service settings
     */
    settings: {},
    /**
     * Service dependencies
     */
    dependencies: [],
    /**
     * Actions
     */
    actions: {
        /**
         * Say a 'Hello'
         *
         * @returns
         */
        hello() {
            return "Hello Moleculer";
        },
        /**
         * Welcome a username
         *
         * @param {String} name - User name
         */
        welcome: {
            params: {
                name: "string",
            },
            handler(ctx) {
                return `Welcome, ${ctx.params.name}`;
            },
        },
    },
    /**
     * Events
     */
    events: {},
    /**
     * Methods
     */
    methods: {},
    /**
     * Service created lifecycle event handler
     */
    created() {
    },
};
//# sourceMappingURL=greeter.js.map
import Moleculer from "moleculer";
import { GreeterServiceAPISchema } from "./greeter.api";

export const GreeterServiceSchema: Moleculer.ServiceSchema = {
  name: "greeter",

  metadata: {
    api: GreeterServiceAPISchema,
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
        return `Welcome, ${(ctx.params! as any).name}`;
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

  /**
   * Service started lifecycle event handler
   */
  // started() {

  // },

  /**
   * Service stopped lifecycle event handler
   */
  // stopped() {

  // },
};

"use strict";

import { ServiceBroker } from "moleculer";
import { MoleculerServiceBroker, APIGateway } from "../../src";

// Create broker
const gw = new APIGateway({
  broker: new MoleculerServiceBroker({ broker: { transporter: "TCP", nodeID: "gw-node" } }),
  schema: {
    plugin: {
      protocol: {},
      policy: {},
    },
    handler: {
    },
  },
  server: {
    port: 8080,
    basePath: "/",
    extension: {},
    middleware: {},
  },
});

// Start gateway
gw.start()
  .then(async () => {
    setTimeout(async () => {
      // Create another brokers
      const broker2 = new ServiceBroker({ transporter: "TCP", nodeID: "node2" });
      broker2.createService({
        name: "foo",
        metadata: {
          description: "hello...foo",
        },
        actions: {
          do: {
            description: "test...",
            deprecated: false,
            params: {
              test: "boolean",
            },
            handler() {
              return { foo: true };
            },
          },
          doStream: {
            meta: {
              filename: "string",
            },
            handler(ctx) {
              console.log(ctx.meta, "foo got stream request...");
              const s = require("fs").createWriteStream(`./test-streaming.txt`);
              ctx.params!.pipe(s);
              ctx.meta.responsedMetadata = "1234";
              return require("fs").createReadStream("./tslint.json");
            },
          },
        },
        events: {
          "$services.*": {
            group: "fuck",
            // @ts-ignore
            deprecated: false,
            description: "balblabla",
            handler(){
              // ...
            },
          },
        },
      });
      await broker2.start();

      setTimeout(async () => {
        const broker3 = new ServiceBroker({ transporter: "TCP", nodeID: "node3" });
        broker3.createService({
          name: "bar",
          metadata: {
            description: "hello...bar",
          },
          actions: {
            do() {
              return { bar: true };
            },
          },
        });
        await broker3.start();

        // @ts-ignore
        gw.broker.broker.repl();
        // @ts-ignore
        const res = await gw.broker.call(gw.broker.newContext({ requestID: "helloWorld" }), {
          action: "foo.doStream",
          candidateNodes: ["node2"],
          params: { stream: require("fs").createReadStream("./tslint.json"), meta: { filename: "test" } },
        });
        console.log ("response ...... ", res);
      }, 500);
    }, 500);

    // Do test
    // broker
    //   .call("api.test", {name: "John Doe"})
    //   .then(broker.logger.info)
    //   // @ts-ignore
    //   .catch(broker.logger.error);
  });

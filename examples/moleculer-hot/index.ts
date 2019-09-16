"use strict";

import { ServiceBroker } from "moleculer";
import { zzzService } from "./service";

const broker = new ServiceBroker({ transporter: "TCP", nodeID: "node-hot" });

broker.start()
  .then(() => {
    broker.repl();
    broker.createService(zzzService);
});

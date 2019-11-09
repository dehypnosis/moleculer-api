import * as Moleculer from "moleculer";
import { Service, ServiceNode } from "../../";
import { hashObject } from "../../../interface";

export function proxyMoleculerServiceDiscovery(node: Moleculer.BrokerNode): Service[] {
  const id = node.id;
  const {hostname, ipList, config, port, seq, metadata, sender, instanceID, services, ...meta} = node.rawInfo;

  // create node
  const foundNode = new ServiceNode({
    id,
    displayName: hostname || ipList.join(", "),
    meta,
  });

  const foundServices: Service[] = [];

  for (const service of services) {
    // skip internal services
    const serviceId = service.name;
    if (serviceId.startsWith("$")) continue;

    // tslint:disable-next-line:no-shadowed-variable
    const {displayName = serviceId, description = null, ...meta} = service.metadata;

    // create service
    const foundService = new Service({
      id: serviceId,
      displayName,
      description,
      meta,
      nodes: [foundNode],
      hash: hashObject([serviceId, meta, service.actions, service.events], true),
    });

    // add actions
    for (const action of Object.values(service.actions) as any) {
      // tslint:disable-next-line:no-shadowed-variable
      const {name, rawName, description = null, deprecated = false, params = null, cache = null, handler, meta = null, ...others } = action;
      foundService.addAction({
        id: name,
        displayName: rawName,
        description,
        deprecated,
        // TODO: streaming support for params schema generation
        paramsSchema: meta && typeof meta === "object" ? {
          stream: {
            type: "any",
            description: "An instance of `ReadableStream` as `ctx.params`",
          },
          meta: {
            type: "object",
            description: "Additional props to `ctx.meta`",
            props: meta,
          },
        } : params,
        cachePolicy: cache && cache.ttl ? cache : null,
        meta: others,
      });
    }

    // add subscribed events
    for (const event of Object.values(service.events) as any) {
      // tslint:disable-next-line:no-shadowed-variable
      const {group = service.name, deprecated = false, description = null, name, displayName, ...meta} = event;
      foundService.addSubscribedEvent({
        id: name,
        displayName: displayName || name,
        group,
        description,
        deprecated,
        meta,
      });
    }

    foundServices.push(foundService);
  }

  return foundServices;
}

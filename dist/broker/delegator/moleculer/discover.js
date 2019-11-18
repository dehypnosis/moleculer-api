"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const __1 = require("../../");
const interface_1 = require("../../../interface");
function proxyMoleculerServiceDiscovery(node) {
    const id = node.id;
    const _a = node.rawInfo, { hostname, ipList, config, port, seq, metadata, sender, instanceID, services } = _a, meta = tslib_1.__rest(_a, ["hostname", "ipList", "config", "port", "seq", "metadata", "sender", "instanceID", "services"]);
    // create node
    const foundNode = new __1.ServiceNode({
        id,
        displayName: hostname || ipList.join(", "),
        meta,
    });
    const foundServices = [];
    for (const service of services) {
        // skip internal services
        const serviceId = service.name;
        if (serviceId.startsWith("$"))
            continue;
        // tslint:disable-next-line:no-shadowed-variable
        const _b = service.metadata, { displayName = serviceId, description = null } = _b, meta = tslib_1.__rest(_b, ["displayName", "description"]);
        // create service
        const foundService = new __1.Service({
            id: serviceId,
            displayName,
            description,
            meta,
            nodes: [foundNode],
            hash: interface_1.hashObject([serviceId, meta, service.actions, service.events], true),
        });
        // add actions
        for (const action of Object.values(service.actions)) {
            // tslint:disable-next-line:no-shadowed-variable
            const { name, rawName, description = null, deprecated = false, params = null, cache = null, handler, meta = null } = action, others = tslib_1.__rest(action, ["name", "rawName", "description", "deprecated", "params", "cache", "handler", "meta"]);
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
        for (const event of Object.values(service.events)) {
            // tslint:disable-next-line:no-shadowed-variable
            const { group = service.name, deprecated = false, description = null, name, displayName } = event, meta = tslib_1.__rest(event, ["group", "deprecated", "description", "name", "displayName"]);
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
exports.proxyMoleculerServiceDiscovery = proxyMoleculerServiceDiscovery;
//# sourceMappingURL=discover.js.map
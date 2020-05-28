"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createMoleculerServiceSchema = void 0;
const discover_1 = require("./discover");
const serviceName = "$api";
function createMoleculerServiceSchema(props) {
    const discoveryMap = new Map(); // nodeId -> discovered Service[]
    return {
        name: serviceName,
        events: {
            /* receive all events and broker */
            "**": (ctx) => {
                const event = ctx.eventName;
                // skip internal events
                if (!event || event.startsWith("$")) {
                    return;
                }
                const params = ctx.params;
                const groups = ctx.eventGroups ? (Array.isArray(ctx.eventGroups) ? ctx.eventGroups : [ctx.eventGroups]) : (ctx.eventType === "broadcastLocal" ? [serviceName] : []);
                const broadcast = ctx.eventType === "broadcast";
                let from;
                const nodeId = ctx.nodeID;
                const serviceId = ctx.service && (ctx.service.fullName || ctx.service.name || ctx.service.id);
                if (nodeId && serviceId) {
                    from = `${nodeId}@${serviceId}`;
                }
                // broker event
                props.emitEvent({ event, params, groups, broadcast, from });
            },
            /* service discovery */
            "$node.updated": (ctx) => {
                const node = ctx.params.node;
                // remove old services
                const oldServices = discoveryMap.get(node.id);
                for (const service of oldServices) {
                    if (service.id === serviceName) {
                        continue; // will not discover "this" services
                    }
                    props.emitServiceDisconnected(service, node.id);
                }
                discoveryMap.delete(node.id);
                // add latest services
                const latestServices = discover_1.proxyMoleculerServiceDiscovery(node);
                discoveryMap.set(node.id, latestServices);
                for (const service of latestServices) {
                    if (service.id === serviceName) {
                        continue; // will not discover "this" services
                    }
                    props.emitServiceConnected(service);
                }
            },
            "$node.connected": (ctx) => {
                const node = ctx.params.node;
                const services = discover_1.proxyMoleculerServiceDiscovery(node);
                discoveryMap.set(node.id, services);
                for (const service of services) {
                    if (service.id === serviceName) {
                        continue; // will not discover "this" services
                    }
                    props.emitServiceConnected(service);
                }
            },
            "$node.disconnected": (ctx) => {
                const node = ctx.params.node;
                const services = discoveryMap.get(node.id) || [];
                for (const service of services) {
                    if (service.id === serviceName) {
                        continue; // will not discover "this" services
                    }
                    props.emitServiceDisconnected(service, node.id);
                }
                discoveryMap.delete(node.id);
            },
        },
    };
}
exports.createMoleculerServiceSchema = createMoleculerServiceSchema;
//# sourceMappingURL=service.js.map
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ServiceCatalog = void 0;
class ServiceCatalog {
    constructor(map) {
        this.serviceIdItemsMap = map || new Map();
        this.actionMap = new Map();
        // indexing action map
        for (const items of this.serviceIdItemsMap.values()) {
            for (const item of items) {
                this.setActions(item.service);
            }
        }
    }
    clone() {
        const map = new Map();
        for (const [serviceId, items] of this.serviceIdItemsMap.entries()) {
            map.set(serviceId, items.slice());
        }
        return new ServiceCatalog(map);
    }
    get size() {
        return this.serviceIdItemsMap.size;
    }
    get(serviceId) {
        const items = this.serviceIdItemsMap.get(serviceId);
        return items && items[0] || null;
    }
    get services() {
        return Array.from(this.serviceIdItemsMap.values())
            .reduce((services, items) => services.concat(items.map(item => item.service)), []);
    }
    add(item) {
        const serviceId = item.service.id;
        if (!this.serviceIdItemsMap.has(serviceId)) {
            this.serviceIdItemsMap.set(serviceId, []);
        }
        const items = this.serviceIdItemsMap.get(serviceId);
        items.unshift(item);
        items.sort((a, b) => b.priority - a.priority); // make descending order by priority
        this.setActions(items[0].service, true);
    }
    remove(service) {
        const items = this.serviceIdItemsMap.get(service.id);
        if (!items) {
            return false;
        }
        const itemIndex = items.findIndex(item => item.service === service);
        if (itemIndex === -1) {
            return false;
        }
        items.splice(itemIndex, 1);
        // reset preferred action map
        this.removeActions(service);
        for (const item of items) {
            this.setActions(item.service);
        }
        return true;
    }
    findAction(id) {
        return this.actionMap.get(id) || null;
    }
    setActions(service, override = false) {
        for (const [id, action] of service.actionMap) {
            if (override || !this.actionMap.has(id)) {
                this.actionMap.set(id, action);
            }
        }
    }
    removeActions(service) {
        for (const id of service.actionMap.keys()) {
            this.actionMap.delete(id);
        }
    }
}
exports.ServiceCatalog = ServiceCatalog;
//# sourceMappingURL=catalog.js.map
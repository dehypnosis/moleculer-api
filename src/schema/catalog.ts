import { Service, ServiceAction } from "../broker";
import { ServiceAPIIntegrationSource } from "./integration";

type ServiceCatalogItem = {
  service: Readonly<Service>;
  integration: ServiceAPIIntegrationSource | null;
  priority: number;
};

export class ServiceCatalog {
  private readonly serviceIdItemsMap: Map<string, ServiceCatalogItem[]>;
  private readonly actionMap: Map<string, Readonly<ServiceAction>>;

  constructor(map?: Map<string, ServiceCatalogItem[]>) {
    this.serviceIdItemsMap = map || new Map<string, ServiceCatalogItem[]>();
    this.actionMap = new Map<string, Readonly<ServiceAction>>();

    // indexing action map
    for (const items of this.serviceIdItemsMap.values()) {
      for (const item of items) {
        this.setActions(item.service);
      }
    }
  }

  public clone(): ServiceCatalog {
    const map = new Map<string, ServiceCatalogItem[]>();
    for (const [serviceId, items] of this.serviceIdItemsMap.entries()) {
      map.set(serviceId, items.slice());
    }
    return new ServiceCatalog(map);
  }

  public get size(): number {
    return this.serviceIdItemsMap.size;
  }

  public get(serviceId: string): ServiceCatalogItem | null {
    const items = this.serviceIdItemsMap.get(serviceId);
    return items && items[0] || null;
  }

  public get services(): Readonly<Service>[] {
    return Array.from(this.serviceIdItemsMap.values())
      .reduce((services, items) => services.concat(items.map(item => item.service)), [] as Readonly<Service>[]);
  }

  public add(item: Readonly<ServiceCatalogItem>): void {
    const serviceId = item.service.id;
    if (!this.serviceIdItemsMap.has(serviceId)) {
      this.serviceIdItemsMap.set(serviceId, []);
    }
    const items = this.serviceIdItemsMap.get(serviceId)!;
    items.unshift(item);
    items.sort((a, b) => b.priority - a.priority); // make descending order by priority
    this.setActions(items[0].service, true);
  }

  public remove(service: Readonly<Service>): boolean {
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

  public findAction(id: string): Readonly<ServiceAction> | null {
    return this.actionMap.get(id) || null;
  }

  private setActions(service: Readonly<Service>, override = false) {
    for (const [id, action] of service.actionMap) {
      if (override || !this.actionMap.has(id)) {
        this.actionMap.set(id, action);
      }
    }
  }

  private removeActions(service: Readonly<Service>) {
    for (const id of service.actionMap.keys()) {
      this.actionMap.delete(id);
    }
  }
}

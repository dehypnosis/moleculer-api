import { Service, ServiceAction } from "../broker";
import { ServiceAPIIntegrationSource } from "./integration";
declare type ServiceCatalogItem = {
    service: Readonly<Service>;
    integration: ServiceAPIIntegrationSource | null;
    priority: number;
};
export declare class ServiceCatalog {
    private readonly serviceIdItemsMap;
    private readonly actionMap;
    constructor(map?: Map<string, ServiceCatalogItem[]>);
    clone(): ServiceCatalog;
    get size(): number;
    get(serviceId: string): ServiceCatalogItem | null;
    get services(): Readonly<Service>[];
    add(item: Readonly<ServiceCatalogItem>): void;
    remove(service: Readonly<Service>): boolean;
    findAction(id: string): Readonly<ServiceAction> | null;
    private setActions;
    private removeActions;
}
export {};

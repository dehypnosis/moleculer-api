import { Reporter, Service, ServiceAction } from "../broker";
import { ValidationError } from "../interface";
import { Branch } from "./branch";
import { ServiceCatalog } from "./catalog";
import { ServiceAPISchema } from "./index";
import { Version } from "./version";
export declare type ServiceAPIIntegrationSource = {
    schema: Readonly<ServiceAPISchema>;
    service: Readonly<Service>;
    schemaHash: string;
    reporter: Readonly<Reporter>;
};
declare type ServiceAPIIntegrationProps = {
    type: "add" | "remove";
    source: ServiceAPIIntegrationSource;
    serviceCatalog: ServiceCatalog;
};
export declare class ServiceAPIIntegration {
    protected readonly props: ServiceAPIIntegrationProps;
    static readonly Type: {
        Add: "add";
        Remove: "remove";
    };
    static readonly Status: {
        Queued: "queued";
        Failed: "failed";
        Succeed: "succeed";
        Skipped: "skipped";
    };
    private static readonly StatusColor;
    private $status;
    private $errors;
    constructor(props: ServiceAPIIntegrationProps);
    clone(): Readonly<ServiceAPIIntegration>;
    toString(): string;
    get information(): {
        type: "remove" | "add";
        status: "queued" | "failed" | "succeed" | "skipped";
        hash: string;
        schema: Readonly<ServiceAPISchema>;
        service: string;
    };
    get type(): "remove" | "add";
    get schema(): Readonly<ServiceAPISchema>;
    get schemaHash(): string;
    get service(): Readonly<Service>;
    get reporter(): Readonly<Reporter>;
    get status(): "queued" | "failed" | "succeed" | "skipped";
    findAction(actionId: string): Readonly<ServiceAction> | null;
    setFailed(branch: Readonly<Branch>, version: Readonly<Version>, errors: ReadonlyArray<Readonly<ValidationError>>, integrations: ReadonlyArray<Readonly<ServiceAPIIntegration>>): void;
    setSucceed(branch: Readonly<Branch>, version: Readonly<Version>, updates?: Readonly<string[]>): void;
    get errors(): ValidationError[] | null;
    setSkipped(branch: Readonly<Branch>, version: Readonly<Version>): void;
    reportRemoved(branch: Readonly<Branch>, version: Readonly<Version>): void;
}
export {};

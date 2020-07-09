import { Service } from "../broker";
import { RecursivePartial } from "../interface";
import { Logger } from "../logger";
import { ServiceCatalog } from "./catalog";
import { ProtocolPlugin } from "./plugin";
import { ServiceAPIIntegrationSource } from "./integration";
import { Version } from "./version";
export declare type BranchProps = {
    name: string;
    logger: Logger;
    protocolPlugins: ReadonlyArray<ProtocolPlugin<any, any>>;
    parentVersion?: Readonly<Version>;
    serviceCatalog?: ServiceCatalog;
};
export declare type BranchOptions = {
    maxVersions: number;
    maxUnusedSeconds: number;
};
export declare class Branch {
    protected readonly props: BranchProps;
    static readonly Master = "master";
    static readonly Event: {
        Updated: string;
        Removed: string;
    };
    private static lock;
    private readonly opts;
    private readonly serviceCatalog;
    private $latestVersion;
    private emitter;
    constructor(props: BranchProps, opts?: RecursivePartial<BranchOptions>);
    toString(): string;
    getInformation(includeServices?: boolean): {
        branch: string;
        latestUsedAt: Date;
        parentVersion: string | null;
        latestVersion: string;
        versions: {
            version: string;
            fullVersion: string;
            routes: any[];
            integrations: {
                type: "remove" | "add";
                status: "queued" | "failed" | "succeed" | "skipped";
                hash: string;
                schema: Readonly<import(".").ServiceAPISchema>;
                service: string;
            }[];
        }[];
        services: {
            id: string;
            hash: string;
            name: string;
            description: string | null;
            meta: object | null;
            nodes: {
                id: string;
                displayName: string;
                meta: object | null;
            }[];
            actions: {
                examples: import("../broker/registry/action").ActionExample[] | null;
                id: string;
                displayName: string;
                description: string | null;
                deprecated: boolean;
                paramsSchema: import("../interface").NormalizedValidationSchema | null;
                cachePolicy: import("../broker/registry/action").ServiceActionCachePolicy | null;
                meta: object | null;
            }[] | null;
        }[] | null;
    };
    get name(): string;
    get isMaster(): boolean;
    private latestUsedAt;
    get isUnused(): boolean;
    get unusedSeconds(): number;
    touch(): void;
    get services(): Readonly<Service>[];
    get latestVersion(): Readonly<Version>;
    get versions(): ReadonlyArray<Readonly<Version>>;
    fork(props: {
        logger: Logger;
        name: string;
    }): Promise<Branch>;
    connectService(service: Readonly<Service>, integration: ServiceAPIIntegrationSource | null): Promise<void>;
    disconnectService(service: Readonly<Service>): Promise<void>;
    private consumeIntegrations;
    private retryFailedIntegrationsFrom;
    start(listener: {
        started: () => void;
        updated: () => void;
        removed: () => void;
    }): Promise<void>;
    stop(): Promise<void>;
}

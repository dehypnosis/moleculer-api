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
    readonly name: string;
    readonly isMaster: boolean;
    private latestUsedAt;
    readonly isUnused: boolean;
    readonly unusedSeconds: number;
    touch(): void;
    readonly services: Array<Readonly<Service>>;
    readonly latestVersion: Readonly<Version>;
    readonly versions: ReadonlyArray<Readonly<Version>>;
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

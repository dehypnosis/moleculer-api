import { RecursivePartial } from "../interface";
import { ServiceBroker } from "../broker";
import { Logger } from "../logger";
import { Branch, BranchOptions } from "./branch";
import { SchemaPluginConstructorOptions } from "./plugin";
export declare type SchemaRegistryProps = {
    brokers: Array<Readonly<ServiceBroker>>;
    logger: Logger;
};
export declare type SchemaRegistryOptions = {
    branch: BranchOptions;
} & SchemaPluginConstructorOptions;
export declare type SchemaRegistryListeners = {
    updated: (branch: Branch) => void;
    removed: (branch: Branch) => void;
};
export declare class SchemaRegistry {
    protected props: SchemaRegistryProps;
    private static Event;
    private readonly plugin;
    private readonly branchMap;
    private readonly branchOptions?;
    private readonly emitter;
    constructor(props: SchemaRegistryProps, opts?: RecursivePartial<SchemaRegistryOptions>);
    start(listeners: SchemaRegistryListeners): Promise<void>;
    stop(): Promise<void>;
    private lock;
    private serviceReporterMap;
    private serviceConnected;
    private serviceDisconnected;
    private serviceNodePoolUpdated;
    private validateServiceAPISchema;
    private hashServiceAPISchema;
    private findOrCreateBranch;
    getBranch(branchName: string): Readonly<Branch> | null;
    getBranches(): Array<Readonly<Branch>>;
    deleteBranch(branchName: string): Promise<boolean>;
    private $deleteBranch;
    private clearUnusedBranchesIntervalTimer?;
    private clearUnusedBranches;
}

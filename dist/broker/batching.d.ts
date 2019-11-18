import { RecursivePartial } from "../interface";
export declare type BatchingPoolOptions = {
    batchingKey: (...args: any[]) => any;
    entryKey: (batchingParams: any) => any;
    failedEntryCheck: (entry: any) => boolean;
    entriesLimit: number;
};
export declare class BatchingPool {
    private readonly loaderMap;
    private readonly opts;
    constructor(opts?: RecursivePartial<BatchingPoolOptions>);
    getBatchingKey(...args: any[]): any;
    hasBatchingHandler(key: any): boolean;
    setBatchingHandler(key: any, handler: (batchingParamsList: any[]) => Promise<any[]>): void;
    batch(key: any, batchingParams: any): Promise<any | Error>;
    clear(): void;
}

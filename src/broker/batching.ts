// tslint:disable:max-classes-per-file
import * as _ from "lodash";
import DataLoader from "dataloader";
import { RecursivePartial, hashObject } from "../interface";

export type BatchingPoolOptions = {
  batchingKey: (...args: any[]) => any;
  entryKey: (batchingParams: any) => any;
  failedEntryCheck: (entry: any) => boolean;
  entriesLimit: number;
};

const defaultOptions: BatchingPoolOptions = {
  batchingKey: (...args: any[]) => hashObject(args, true),
  entryKey: (batchingParams: any) => hashObject(batchingParams, true),
  failedEntryCheck: (entry: any) => !!(entry && entry.batchingError),
  entriesLimit: 100,
};

export class BatchingPool {
  private readonly loaderMap = new Map<any, DataLoader<any, any>>();
  private readonly opts: BatchingPoolOptions;

  constructor(opts?: RecursivePartial<BatchingPoolOptions>) {
    this.opts = _.defaultsDeep(opts || {}, defaultOptions);
  }

  public getBatchingKey(...args: any[]): any {
    return this.opts.batchingKey(...args);
  }

  public hasBatchingHandler(key: any): boolean {
    return this.loaderMap.has(key);
  }

  public setBatchingHandler(key: any, handler: (batchingParamsList: any[]) => Promise<any[]>): void {
    const loader = new DataLoader<any, any>((batchingParamsList: any[]) => {
      return handler(batchingParamsList)
        .then(entries => {
          return entries.map(entry => {
            if (this.opts.failedEntryCheck(entry)) {
              // wrap entry as Error, ref: https://github.com/graphql/dataloader/blob/master/src/index.js#L175
              const err = new Error("failed batching entry"); // TODO: normalize error
              for (const [k, v] of Object.entries(entry)) {
                // @ts-ignore
                err[k] = v;
              }
              return err;
            }
            return entry;
          });
        });
    }, {
      batch: true,
      maxBatchSize: this.opts.entriesLimit,
      cache: true,
      cacheKeyFn: this.opts.entryKey,
    });
    this.loaderMap.set(key, loader);
  }

  public async batch(key: any, batchingParams: any): Promise<any | Error> {
    const loader = this.loaderMap.get(key)!;
    console.assert(loader, "cannot find batching handler with given key");
    return loader.load(batchingParams);
  }

  public clear() {
    this.loaderMap.clear();
  }
}

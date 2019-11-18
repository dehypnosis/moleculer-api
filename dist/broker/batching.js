"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
// tslint:disable:max-classes-per-file
const _ = tslib_1.__importStar(require("lodash"));
const dataloader_1 = tslib_1.__importDefault(require("dataloader"));
const interface_1 = require("../interface");
const defaultOptions = {
    batchingKey: (...args) => interface_1.hashObject(args, true),
    entryKey: (batchingParams) => interface_1.hashObject(batchingParams, true),
    failedEntryCheck: (entry) => !!(entry && entry.batchingError),
    entriesLimit: 100,
};
class BatchingPool {
    constructor(opts) {
        this.loaderMap = new Map();
        this.opts = _.defaultsDeep(opts || {}, defaultOptions);
    }
    getBatchingKey(...args) {
        return this.opts.batchingKey(...args);
    }
    hasBatchingHandler(key) {
        return this.loaderMap.has(key);
    }
    setBatchingHandler(key, handler) {
        const loader = new dataloader_1.default((batchingParamsList) => {
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
    batch(key, batchingParams) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const loader = this.loaderMap.get(key);
            console.assert(loader, "cannot find batching handler with given key");
            return loader.load(batchingParams);
        });
    }
    clear() {
        this.loaderMap.clear();
    }
}
exports.BatchingPool = BatchingPool;
//# sourceMappingURL=batching.js.map
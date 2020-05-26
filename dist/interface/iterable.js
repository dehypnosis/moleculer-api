"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.composeAsyncIterators = void 0;
const map_1 = require("axax/es5/map");
const filter_1 = require("axax/es5/filter");
const pipe_1 = require("axax/es5/pipe");
const merge_1 = require("axax/es5/merge");
const iterall_1 = require("iterall");
if (Symbol.asyncIterator === undefined)
    (Symbol.asyncIterator) = iterall_1.$$asyncIterator;
if (Symbol.iterator === undefined)
    (Symbol.iterator) = iterall_1.$$iterator;
function composeAsyncIterators(items) {
    const iterables = [];
    for (const { iterator, filter, map } of items) {
        const asyncIterable = Object.defineProperty({}, Symbol.asyncIterator, {
            value() {
                return iterator;
            },
        });
        const pipes = [];
        if (filter) {
            pipes.push(filter_1.filter(filter));
        }
        if (map) {
            pipes.push(map_1.map(map));
        }
        const wrappedIterable = pipe_1.pipe(...pipes)(asyncIterable);
        iterables.push(wrappedIterable);
    }
    return merge_1.merge(...iterables);
}
exports.composeAsyncIterators = composeAsyncIterators;
//# sourceMappingURL=iterable.js.map
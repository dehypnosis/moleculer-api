"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
class APIRequestContext {
    constructor(props) {
        Object.assign(this, props);
        Object.defineProperty(this, APIRequestContext.StoreSymbol, { value: new Map(), enumerable: true, configurable: false, writable: false }); // should be enumerable, ... for plugins which adjust given context
    }
    static createConstructor(factories, hooks) {
        return (source) => tslib_1.__awaiter(this, void 0, void 0, function* () {
            if (source.hasOwnProperty(APIRequestContext.SourceContextIsCreatingSymbol)) {
                throw new Error("request already handled"); // TODO: normalize error
            }
            // add reference to source which denote parsing context currently
            Object.defineProperty(source, APIRequestContext.SourceContextIsCreatingSymbol, { value: true });
            if (hooks && hooks.before) {
                hooks.before(source);
            }
            // create props
            const props = {};
            const propEntries = yield Promise.all(factories.map((factory) => tslib_1.__awaiter(this, void 0, void 0, function* () { return [factory.key, yield factory.create(source)]; })));
            for (const [k, v] of propEntries) {
                props[k] = v;
            }
            // create context
            const context = new APIRequestContext(props);
            // add reference to source
            Object.defineProperty(source, APIRequestContext.SourceContextSymbol, { value: context });
            if (hooks && hooks.after) {
                hooks.after(source, context);
            }
            return context;
        });
    }
    static find(source) {
        if (source.hasOwnProperty(APIRequestContext.SourceContextSymbol)) {
            return source[APIRequestContext.SourceContextSymbol];
        }
        return null;
    }
    static findProps(source) {
        if (source.hasOwnProperty(APIRequestContext.SourceContextSymbol)) {
            return source[APIRequestContext.SourceContextSymbol];
        }
        return null;
    }
    static isCreating(source) {
        return source.hasOwnProperty(APIRequestContext.SourceContextIsCreatingSymbol);
    }
    /* internal store for broker delegator and plugins */
    set(symbol, value, clear) {
        const store = this[APIRequestContext.StoreSymbol];
        store.set(symbol, [value, clear]);
    }
    get(symbol) {
        const store = this[APIRequestContext.StoreSymbol];
        const item = store.get(symbol);
        return item ? item[0] : undefined;
    }
    clear() {
        const store = this[APIRequestContext.StoreSymbol];
        for (const [value, clear] of store.values()) {
            clear(value);
        }
        store.clear();
    }
}
exports.APIRequestContext = APIRequestContext;
APIRequestContext.SourceContextIsCreatingSymbol = Symbol("APIRequestContextIsCreating");
APIRequestContext.SourceContextSymbol = Symbol("APIRequestContext");
APIRequestContext.StoreSymbol = Symbol("APIRequestContextStore");
//# sourceMappingURL=context.js.map
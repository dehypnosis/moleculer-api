import { APIRequestContextFactory, APIRequestContextProps, APIRequestContextSource } from "./index";

export type APIRequestContextConstructor = (source: APIRequestContextSource) => Promise<APIRequestContext>;

export interface APIRequestContext extends APIRequestContextProps {
}

type APIRequestContextStore = Map<symbol, APIRequestContextStoreItemClearer>;
type APIRequestContextStoreItemClearer = [any, (value: any) => void];

export class APIRequestContext {
  protected constructor(props: APIRequestContextProps) {
    Object.assign(this, props);
    Object.defineProperty(this, APIRequestContext.StoreSymbol, {value: new Map(), enumerable: true, configurable: false, writable: false}); // should be enumerable, ... for plugins which adjust given context
  }

  private static SourceContextIsCreatingSymbol = Symbol("APIRequestContextIsCreating");
  private static SourceContextSymbol = Symbol("APIRequestContext");
  private static StoreSymbol = Symbol("APIRequestContextStore");

  public static createConstructor(
    factories: ReadonlyArray<APIRequestContextFactory<any>>,
    hooks?: {
      before?: (source: APIRequestContextSource) => void;
      after?: (source: APIRequestContextSource, context: APIRequestContext) => void;
    },
  ): APIRequestContextConstructor {
    return async source => {
      console.assert(!source.hasOwnProperty(APIRequestContext.SourceContextIsCreatingSymbol), "cannot call context factory more than once from a request: check ApplicationComponent.unmountRoutes/mountRoutes methods");

      // add reference to source which denote parsing context currently
      Object.defineProperty(source, APIRequestContext.SourceContextIsCreatingSymbol, {value: true});

      if (hooks && hooks.before) {
        hooks.before(source);
      }

      // create props
      const props: APIRequestContextProps = {};
      const propEntries = await Promise.all(factories.map(async factory => [factory.key, await factory.create(source)] as [string, any]));
      for (const [k, v] of propEntries) {
        props[k as keyof APIRequestContextProps] = v;
      }

      // create context
      const context = new APIRequestContext(props);

      // add reference to source
      Object.defineProperty(source, APIRequestContext.SourceContextSymbol, {value: context});

      if (hooks && hooks.after) {
        hooks.after(source, context);
      }

      return context;
    };
  }

  public static find(source: APIRequestContextSource): APIRequestContext | null {
    if (source.hasOwnProperty(APIRequestContext.SourceContextSymbol)) {
      return (source as any)[APIRequestContext.SourceContextSymbol];
    }
    return null;
  }

  public static isCreating(source: APIRequestContextSource): boolean {
    return source.hasOwnProperty(APIRequestContext.SourceContextIsCreatingSymbol);
  }

  /* internal store for broker delegator and plugins */
  public set<T>(symbol: symbol, value: T, clear: (value: T) => void): void {
    const store: APIRequestContextStore = (this as any)[APIRequestContext.StoreSymbol];
    store.set(symbol, [value, clear]);
  }

  public get(symbol: symbol): any {
    const store: APIRequestContextStore = (this as any)[APIRequestContext.StoreSymbol];
    const item = store.get(symbol);
    return item ? item[0] : undefined;
  }

  public clear() {
    const store: APIRequestContextStore = (this as any)[APIRequestContext.StoreSymbol];
    for (const [value, clear] of store.values()) {
      clear(value);
    }
    store.clear();
  }
}

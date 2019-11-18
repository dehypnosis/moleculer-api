import { APIRequestContextFactory, APIRequestContextProps, APIRequestContextSource } from "./index";
export declare type APIRequestContextConstructor = (source: APIRequestContextSource) => Promise<APIRequestContext>;
export interface APIRequestContext extends APIRequestContextProps {
}
export declare class APIRequestContext {
    protected constructor(props: APIRequestContextProps);
    private static SourceContextIsCreatingSymbol;
    private static SourceContextSymbol;
    private static StoreSymbol;
    static createConstructor(factories: ReadonlyArray<APIRequestContextFactory<any>>, hooks?: {
        before?: (source: APIRequestContextSource) => void;
        after?: (source: APIRequestContextSource, context: APIRequestContext) => void;
    }): APIRequestContextConstructor;
    static find(source: APIRequestContextSource): APIRequestContext | null;
    static isCreating(source: APIRequestContextSource): boolean;
    set<T>(symbol: symbol, value: T, clear: (value: T) => void): void;
    get(symbol: symbol): any;
    clear(): void;
}

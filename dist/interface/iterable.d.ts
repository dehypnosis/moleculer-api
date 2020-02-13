export declare type AsyncIteratorComposeItem<T> = {
    iterator: AsyncIterator<T>;
    filter?: ((value: T) => boolean);
    map?: ((value: T) => any);
};
export declare function composeAsyncIterators<T>(items: AsyncIteratorComposeItem<T>[]): AsyncIterator<any>;

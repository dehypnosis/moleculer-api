export declare type AsyncIteratorComposeItem<T> = {
    iterator: AsyncIterator<T>;
    filter?: ((value: T) => boolean);
    map?: ((value: T) => any);
};
export declare function composeAsyncIterators<T>(items: Array<AsyncIteratorComposeItem<T>>): AsyncIterator<any>;

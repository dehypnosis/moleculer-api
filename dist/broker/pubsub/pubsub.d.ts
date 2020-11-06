export declare type PubSubProps = {
    maxListeners: number;
    onError: (error: Error) => void;
};
export declare abstract class PubSub<EVENTS extends {
    [event: string]: any;
}> {
    protected readonly props: PubSubProps;
    private readonly delegator;
    protected constructor(props: PubSubProps);
    asyncIterator<EVENT extends Extract<keyof EVENTS, string>>(eventNamePattern: EVENT): AsyncIterator<EVENTS[EVENT]>;
    subscribe<EVENT extends Extract<keyof EVENTS, string>>(eventNamePattern: EVENT, listener: (payload: EVENTS[EVENT]) => void): Promise<number[]>;
    unsubscribe(id: number): void;
    unsubscribeAll(): void;
    publish<EVENT extends Extract<keyof EVENTS, string>>(eventName: EVENT, params: EVENTS[EVENT]): Promise<void>;
}

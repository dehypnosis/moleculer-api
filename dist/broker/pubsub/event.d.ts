import { PubSub, PubSubProps } from "./pubsub";
export declare type EventPacket = {
    event: string;
    params: any;
    groups: string[];
    broadcast: boolean;
    from?: string;
};
export declare type EventListener = (event: Readonly<EventPacket>) => void;
export declare class EventPubSub extends PubSub<{
    [event: string]: Readonly<EventPacket>;
}> {
    protected readonly props: PubSubProps;
    constructor(props: PubSubProps);
}

import { Service } from "../registry";
import { PubSub, PubSubProps } from "./pubsub";
export declare type DiscoveryPubSubProps = Omit<PubSubProps, "maxListeners">;
export declare class DiscoveryPubSub extends PubSub<{
    connected: Readonly<Service>;
    disconnected: Readonly<Service>;
    nodePoolUpdated: Readonly<Service>;
}> {
    constructor(props: DiscoveryPubSubProps);
    subscribeAll(listeners: {
        connected: (service: Readonly<Service>) => void;
        disconnected: (service: Readonly<Service>) => void;
        nodePoolUpdated: (service: Readonly<Service>) => void;
    }): Promise<void>;
}

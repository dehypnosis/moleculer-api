import { Service } from "../registry";
import { PubSub, PubSubProps } from "./pubsub";

export type DiscoveryPubSubProps = Omit<PubSubProps, "maxListeners" /*|"eventNamePatternResolver"*/>;

export class DiscoveryPubSub extends PubSub<{
  connected: Readonly<Service>;
  disconnected: Readonly<Service>;
  nodePoolUpdated: Readonly<Service>;
}> {
  public constructor(props: DiscoveryPubSubProps) {
    super({ maxListeners: 1, /*eventNamePatternResolver: null,*/ ...props });
  }

  public async subscribeAll(listeners: {
    connected: (service: Readonly<Service>) => void;
    disconnected: (service: Readonly<Service>) => void;
    nodePoolUpdated: (service: Readonly<Service>) => void;
  }): Promise<void> {
    await Promise.all([
      this.subscribe("connected", listeners.connected),
      this.subscribe("disconnected", listeners.disconnected),
      this.subscribe("nodePoolUpdated", listeners.nodePoolUpdated),
    ]);
  }
}

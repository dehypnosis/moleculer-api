import { PubSub, PubSubProps } from "./pubsub";

// groups=[] means event toward all available topics
// broadcast=true means event toward all individual queues for each groups
export type EventPacket = { event: string, params: any, groups: string[], broadcast: boolean, from?: { nodeId: string, serviceId: string, serviceHash: string } };
export type EventListener = (event: Readonly<EventPacket>) => void;

export class EventPubSub extends PubSub<{
  [event: string]: Readonly<EventPacket>;
}> {
  constructor(protected readonly props: PubSubProps) {
    super(props);
  }
}

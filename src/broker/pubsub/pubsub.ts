import { PubSub as PubSubDelegator } from "graphql-subscriptions";
/*
* This PubSub implementation is for common use case of any plugins not just for GraphQL Plugin
*/

export type PubSubProps = {
  maxListeners: number;
  onError: (error: Error) => void;
  // eventNamePatternResolver: ((eventNamePattern: string) => string[]) | null;
};

export abstract class PubSub<EVENTS extends { [event: string]: any }> {
  private readonly delegator = new PubSubDelegator();

  protected constructor(protected readonly props: PubSubProps) {
    this.delegator = new PubSubDelegator();
    // @ts-ignore
    this.delegator.ee.setMaxListeners(props.maxListeners);
    // @ts-ignore
    this.delegator.ee.on("error", props.onError);
  }

  public asyncIterator<EVENT extends Extract<keyof EVENTS, string>>(eventNamePattern: EVENT): AsyncIterator<EVENTS[EVENT]> {
    // const eventNames = this.props.eventNamePatternResolver ? this.props.eventNamePatternResolver(eventNamePattern) : [eventNamePattern];
    return this.delegator.asyncIterator<EVENTS[EVENT]>( [eventNamePattern]);
  }

  public subscribe<EVENT extends Extract<keyof EVENTS, string>>(eventNamePattern: EVENT, listener: (payload: EVENTS[EVENT]) => void): Promise<number[]> {
    // const eventNames = this.props.eventNamePatternResolver ? this.props.eventNamePatternResolver(eventNamePattern) : [eventNamePattern];
    return Promise.all([eventNamePattern].map(eventName => this.delegator.subscribe(eventName, listener)));
  }

  public unsubscribe(id: number): void {
    this.delegator.unsubscribe(id);
  }

  public unsubscribeAll(): void {
    // @ts-ignore
    const subscriptionIds: number[] = Object.keys(this.delegator.subscriptions);
    for (const subId of subscriptionIds) {
      this.unsubscribe(subId);
    }
  }

  public publish<EVENT extends Extract<keyof EVENTS, string>>(eventName: EVENT, params: EVENTS[EVENT]): Promise<void> {
    return this.delegator.publish(eventName, params);
  }
}

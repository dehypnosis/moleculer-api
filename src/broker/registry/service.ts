import * as kleur from "kleur";
import { ServiceBroker } from "../broker";
import { ServiceActionProps } from "./action";
import { ServiceEventProps } from "./event";
import { ServiceNode, ServiceAction, ServiceEvent, ServiceStatus } from "./index";
import { ServiceNodeProps } from "./node";

export type ServiceProps = {
  nodes: ServiceNode[];
  id: string; // could be duplicate between different versions of services
  hash: string; // should be unique
  displayName: string;
  description: string | null;
  meta: object | null;
};

export class Service {
  public readonly nodeIdMap: Map<string, Readonly<ServiceNode>>;
  public readonly actionMap: Map<string, Readonly<ServiceAction>>;
  public readonly subscribedEvents: Readonly<ServiceEvent>[];
  public readonly status: ServiceStatus = {message: "unknown", code: 503, updatedAt: new Date()};
  public readonly shortHash: string;
  private $broker: Readonly<ServiceBroker> | null = null;

  constructor(protected readonly props: ServiceProps) {
    this.nodeIdMap = new Map<string, ServiceNode>(this.props.nodes.map(n => [n.id, n]));
    this.actionMap = new Map<string, ServiceAction>();
    this.shortHash = this.props.hash.substr(0, 8);
    this.subscribedEvents = [];

    // clear nodes props for garbage collection
    this.props.nodes.splice(0);
  }

  public get hash() {
    return this.props.hash;
  }

  public get id() {
    return this.props.id;
  }

  public get displayName() {
    return this.props.displayName;
  }

  public get description(): string | null {
    return this.props.description;
  }

  public get meta(): Readonly<object> | null {
    return this.props.meta;
  }

  public get broker(): Readonly<ServiceBroker> | null {
    return this.$broker || null;
  }

  public setBroker(broker: Readonly<ServiceBroker> | null) {
    this.$broker = broker;
  }

  public toString(): string {
    return `${kleur.blue(`${this.props.id}:${this.shortHash}`)}${kleur.cyan("@")}${kleur.green(this.empty ? "empty-node-pool" : Array.from(this.nodeIdMap.keys()).join(","))}`;
  }

  public get empty() {
    return this.nodeIdMap.size === 0;
  }

  public addNode(node: ServiceNodeProps): void {
    this.nodeIdMap.set(node.id, new ServiceNode(node));
  }

  public async healthCheck(): Promise<Readonly<ServiceStatus>> {
    let status: ServiceStatus;
    if (!this.broker) {
      status = {
        message: "service broker is not set",
        code: 500,
        updatedAt: new Date(),
      };
    } else {
      try {
        status = await this.broker.healthCheckService(this);
      } catch (error) {
        status = {
          message: `failed to health check:\n${error.toString()}`,
          code: 500,
          updatedAt: new Date(),
        };
      }
    }
    Object.assign(this.status, status);
    return status;
  }

  public addAction(action: Omit<ServiceActionProps, "service">): ServiceAction {
    const act = new ServiceAction({
      ...action,
      service: this,
    });
    this.actionMap.set(act.id, act);
    return act;
  }

  public addSubscribedEvent(event: Omit<ServiceEventProps, "service">): ServiceEvent {
    const evt = new ServiceEvent({
      ...event,
      service: this,
    });
    const idx = this.subscribedEvents.findIndex(e => e.id === event.id && e.group === event.group);
    if (idx > -1) {
      this.subscribedEvents.splice(idx, 1, evt);
    } else {
      this.subscribedEvents.push(evt);
    }
    return evt;
  }
}

import { ServiceBroker } from "../broker";
import { ServiceActionProps } from "./action";
import { ServiceEventProps } from "./event";
import { ServiceNode, ServiceAction, ServiceEvent, ServiceStatus } from "./index";
import { ServiceNodeProps } from "./node";
export declare type ServiceProps = {
    nodes: ServiceNode[];
    id: string;
    hash: string;
    displayName: string;
    description: string | null;
    meta: object | null;
};
export declare class Service {
    protected readonly props: ServiceProps;
    readonly nodeIdMap: Map<string, Readonly<ServiceNode>>;
    readonly actionMap: Map<string, Readonly<ServiceAction>>;
    readonly subscribedEvents: Array<Readonly<ServiceEvent>>;
    readonly status: ServiceStatus;
    readonly shortHash: string;
    private $broker;
    constructor(props: ServiceProps);
    readonly hash: string;
    readonly id: string;
    readonly displayName: string;
    readonly description: string | null;
    readonly meta: Readonly<object> | null;
    readonly broker: Readonly<ServiceBroker> | null;
    setBroker(broker: Readonly<ServiceBroker> | null): void;
    toString(): string;
    addNode(node: ServiceNodeProps): void;
    healthCheck(): Promise<Readonly<ServiceStatus>>;
    addAction(action: Omit<ServiceActionProps, "service">): ServiceAction;
    addSubscribedEvent(event: Omit<ServiceEventProps, "service">): ServiceEvent;
}

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
    readonly subscribedEvents: Readonly<ServiceEvent>[];
    readonly status: ServiceStatus;
    readonly shortHash: string;
    private $broker;
    constructor(props: ServiceProps);
    get hash(): string;
    get id(): string;
    get displayName(): string;
    get description(): string | null;
    get meta(): Readonly<object> | null;
    get broker(): Readonly<ServiceBroker> | null;
    setBroker(broker: Readonly<ServiceBroker> | null): void;
    toString(): string;
    addNode(node: ServiceNodeProps): void;
    healthCheck(): Promise<Readonly<ServiceStatus>>;
    addAction(action: Omit<ServiceActionProps, "service">): ServiceAction;
    addSubscribedEvent(event: Omit<ServiceEventProps, "service">): ServiceEvent;
}

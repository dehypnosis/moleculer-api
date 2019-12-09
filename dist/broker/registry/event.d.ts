import { EventPacket } from "../pubsub";
import { Service } from "./index";
export declare type ServiceEventProps = {
    service: Service;
    id: string;
    displayName: string;
    group: string;
    description: string | null;
    deprecated: boolean;
    meta: object | null;
};
declare type EventExample = EventPacket & {
    hash?: string;
};
export declare class ServiceEvent {
    protected readonly props: ServiceEventProps;
    private readonly examples;
    constructor(props: ServiceEventProps);
    get service(): Readonly<Service>;
    get id(): string;
    get displayName(): string;
    get group(): string;
    get description(): string | null;
    get deprecated(): boolean;
    get meta(): Readonly<object> | null;
    addExample(example: EventExample, limit: number): void;
    getExamples(limit?: number): EventExample[];
    toString(): string;
}
export {};

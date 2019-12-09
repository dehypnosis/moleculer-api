import { RecursivePartial } from "../../interface";
import { Logger } from "../../logger";
import { EventPacket } from "../pubsub";
import { Service, ServiceAction } from "./index";
export declare type ServiceRegistryProps = {
    logger: Logger;
};
export declare type ServiceRegistryOptions = {
    examples: {
        processIntervalSeconds: number;
        queueLimit: number;
        limitPerActions: number;
        limitPerEvents: number;
        streamNotation: string;
        omittedNotation: string;
        omittedLimit: number;
        redactedNotation: string;
        redactedParamNameRegExps: RegExp[];
    };
    healthCheck: {
        intervalSeconds: number;
    };
};
export declare class ServiceRegistry {
    protected readonly props: ServiceRegistryProps;
    private readonly actionExamplesQueue;
    private readonly eventExamplesQueue;
    private readonly serviceHashMap;
    private readonly opts;
    constructor(props: ServiceRegistryProps, opts?: RecursivePartial<ServiceRegistryOptions>);
    addService(service: Readonly<Service>): void;
    removeServiceByHash(hash: string): boolean;
    findServiceByHash(hash: string): Readonly<Service> | null;
    get services(): Array<Readonly<Service>>;
    addActionExample(args: {
        action: Readonly<ServiceAction>;
        params: any;
        response: any;
    }): void;
    addEventExample(events: string[], packet: EventPacket): void;
    private consumeExamplesQueues;
    private sanitizeObject;
    private healthChecking;
    private healthCheck;
    private healthCheckIntervalTimer?;
    private consumeExamplesIntervalTimer?;
    start(): Promise<void>;
    stop(): Promise<void>;
}

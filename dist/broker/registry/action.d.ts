import { NormalizedValidationSchema } from "../../interface";
import { Service } from "./index";
export declare type ServiceActionCachePolicy = {
    ttl: number;
    [key: string]: any;
};
export declare type ServiceActionProps = {
    service: Service;
    id: string;
    displayName: string;
    description: string | null;
    deprecated: boolean;
    paramsSchema: NormalizedValidationSchema | null;
    cachePolicy: ServiceActionCachePolicy | null;
    meta: object | null;
};
export declare type ActionExample = {
    params: any;
    response: any;
    hash?: string;
};
export declare class ServiceAction {
    protected readonly props: ServiceActionProps;
    private readonly examples;
    readonly paramsSchema: Readonly<NormalizedValidationSchema> | null;
    constructor(props: ServiceActionProps);
    getInformation(includeExamples?: boolean): {
        examples: ActionExample[] | null;
        id: string;
        displayName: string;
        description: string | null;
        deprecated: boolean;
        paramsSchema: NormalizedValidationSchema | null;
        cachePolicy: ServiceActionCachePolicy | null;
        meta: object | null;
    };
    toString(): string;
    get id(): string;
    get displayName(): string;
    get service(): Readonly<Service>;
    get description(): string | null;
    get deprecated(): boolean;
    get cachePolicy(): Readonly<ServiceActionCachePolicy> | null;
    get meta(): Readonly<object> | null;
    addExample(example: ActionExample, limit: number): void;
    getExamples(limit?: number): ActionExample[];
}

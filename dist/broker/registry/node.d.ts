export declare type ServiceNodeProps = {
    id: string;
    displayName: string;
    meta: object | null;
};
export declare class ServiceNode {
    protected readonly props: ServiceNodeProps;
    constructor(props: ServiceNodeProps);
    get id(): string;
    get displayName(): string;
    get meta(): Readonly<object> | null;
    toString(): string;
    getInformation(): {
        id: string;
        displayName: string;
        meta: object | null;
    };
}

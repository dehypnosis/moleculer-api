export declare type ServiceNodeProps = {
    id: string;
    displayName: string;
    meta: object | null;
};
export declare class ServiceNode {
    protected readonly props: ServiceNodeProps;
    constructor(props: ServiceNodeProps);
    readonly id: string;
    readonly displayName: string;
    readonly meta: Readonly<object> | null;
    toString(): string;
}

import { ServiceBrokerDelegator } from "./delegator";
import { MoleculerServiceBrokerDelegator, MoleculerServiceBrokerDelegatorOptions } from "./moleculer";
export { ServiceBrokerDelegator };
declare type ServiceBrokerDelegatorClass = typeof ServiceBrokerDelegator;
interface ServiceBrokerDelegatorInterface extends ServiceBrokerDelegatorClass {
}
export declare const ServiceBrokerDelegatorConstructors: {
    [delegator: string]: ServiceBrokerDelegatorInterface;
};
export declare type ServiceBrokerDelegatorConstructorOptions = {
    [MoleculerServiceBrokerDelegator.key]: MoleculerServiceBrokerDelegatorOptions;
} | {
    [key: string]: never;
};

import { ServiceBrokerDelegator } from "./delegator";
import { MoleculerServiceBrokerDelegator, MoleculerServiceBrokerDelegatorOptions } from "./moleculer";
export { ServiceBrokerDelegator };

type ServiceBrokerDelegatorClass = typeof ServiceBrokerDelegator;

interface ServiceBrokerDelegatorInterface extends ServiceBrokerDelegatorClass {
}

export const ServiceBrokerDelegatorConstructors: { [delegator: string]: ServiceBrokerDelegatorInterface } = {
  [MoleculerServiceBrokerDelegator.key]: MoleculerServiceBrokerDelegator as ServiceBrokerDelegatorInterface,
  // [OtherServiceBrokerDelegator.key]: OtherServiceBrokerDelegator as ServiceBrokerDelegatorInterface,
};

export type ServiceBrokerDelegatorConstructorOptions = {
  [MoleculerServiceBrokerDelegator.key]: MoleculerServiceBrokerDelegatorOptions;
}/* | {
  [OtherServiceBrokerDelegator.key]: OtherServiceBrokerDelegatorOptions;
}*/ | {
  [key: string]: never;
};

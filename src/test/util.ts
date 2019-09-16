import { ServiceBroker } from "../broker";
import { ServiceBrokerDelegatorConstructorOptions } from "../broker/delegator";
import { RecursivePartial } from "../interface";
import { WinstonLogger } from "../logger";
import { SchemaRegistry, SchemaRegistryOptions } from "../schema";
import { APIServer, APIServerOptions } from "../server";

export async function sleepUntil(predicate: () => boolean, timeoutSeconds: number = 10, sleepSeconds: number = 0.5): Promise<void> {
  if (predicate()) return;
  if (timeoutSeconds<=0) return;
  await sleep(sleepSeconds);
  return sleepUntil(predicate, timeoutSeconds-sleepSeconds);
}

export function sleep(seconds: number) {
  return new Promise(r => setTimeout(r, seconds * 1000));
}

type getLoggerProps = { label?: string, level?: "info" | "warn" | "debug" | "error", silent?: boolean };
export function getLogger(props?: getLoggerProps) {
  const label = props && props.label || "test";
  const level = props && props.level || "error";
  const silent = props && props.silent || false;
  return new WinstonLogger({label}, {level, silent});
}

export function getServiceBroker(props?: {
  logger?: getLoggerProps;
  delegator?: ServiceBrokerDelegatorConstructorOptions;
}) {
  const broker = new ServiceBroker({
    logger: getLogger(props && props.logger),
  }, props && props.delegator);
  return broker;
}

export function getSchemaRegistry(props?: {
  logger?: getLoggerProps;
  delegator?: ServiceBrokerDelegatorConstructorOptions;
  opts?: RecursivePartial<SchemaRegistryOptions>;
}) {
  return new SchemaRegistry({
    logger: getLogger(props && props.logger),
    brokers: [getServiceBroker(props)],
  }, props && props.opts);
}

export function getAPIServer(props?: {
  logger?: getLoggerProps;
  schema?: SchemaRegistry;
  opts?: RecursivePartial<APIServerOptions>;
}) {
  return new APIServer({
    logger: getLogger(props && props.logger),
    schema: props && props.schema || getSchemaRegistry(),
  }, props && props.opts);
}

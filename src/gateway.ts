import * as os from "os";
import * as _ from "lodash";
import { FatalError } from "tslint/lib/error";
import { ServiceBroker, ServiceBrokerOptions } from "./broker";
import { RecursivePartial } from "./interface";
import { SchemaRegistry, SchemaRegistryOptions } from "./schema";
import { APIServer, APIServerOptions } from "./server";
import { Logger, LoggerConstructors, LoggerConstructorOptions } from "./logger";

export type APIGatewayOptions = {
  brokers?: Array<RecursivePartial<ServiceBrokerOptions>>,
  schema?: RecursivePartial<SchemaRegistryOptions>,
  server?: RecursivePartial<APIServerOptions>,
  logger?: LoggerConstructorOptions,
} & RecursivePartial<APIGatewayOwnOptions>;

type APIGatewayOwnOptions = {
  skipProcessEventRegistration?: boolean,
};

export class APIGateway {
  private readonly brokers: ServiceBroker[];
  private readonly schema: SchemaRegistry;
  private readonly server: APIServer;
  private readonly logger: Logger;
  private readonly opts: APIGatewayOwnOptions;

  constructor(opts?: APIGatewayOptions) {
    const {brokers, schema, server, logger, ...ownOpts} = opts || {};

    // arrange own options
    this.opts = _.defaultsDeep(ownOpts, {
      skipProcessEventRegistration: false,
    });

    // create logger
    const loggerKeys = Object.keys(LoggerConstructors);
    let loggerKey = logger && loggerKeys.find(type => !!logger[type as keyof LoggerConstructorOptions]);
    if (!loggerKey) {
      loggerKey = loggerKeys[0];
    }
    const loggerOpts = logger && logger[loggerKey as keyof LoggerConstructorOptions] || {};
    const loggerConstructor = LoggerConstructors[loggerKey as keyof LoggerConstructorOptions];
    this.logger = new loggerConstructor({label: os.hostname()}, loggerOpts);

    // create brokers
    const brokerOptionsList = brokers || [];
    if (brokerOptionsList.length === 0) {
      // default broker option is moleculer
      brokerOptionsList.push({
        moleculer: {},
      });
    }
    this.brokers = brokerOptionsList.map((brokerOpts, index) => {
      return new ServiceBroker({
        logger: this.logger.getChild(`broker[${index}]`),
      }, brokerOpts);
    });

    // create schema registry
    this.schema = new SchemaRegistry({
      brokers: this.brokers,
      logger: this.logger.getChild(`schema`),
    }, schema);

    // create server
    this.server = new APIServer({
      schema: this.schema,
      logger: this.logger.getChild(`server`),
    }, server);
  }

  public async start() {
    // catch os shutdown signal
    if (!this.opts.skipProcessEventRegistration) {
      for (const signal of APIGateway.ShutdownSignals) {
        process.on(signal as any, this.handleShutdown);
      }
    }

    // catch uncaught error
    process.on("unhandledRejection", this.handleError);

    try {
      await this.server.start();
    } catch (error) {
      await this.handleError(error);
    }
  }

  public async stop() {
    if (!this.opts.skipProcessEventRegistration) {
      for (const signal of APIGateway.ShutdownSignals) {
        process.removeListener(signal as any, this.handleShutdown);
      }
    }
    process.removeListener("unhandledRejection", this.handleError);
    await this.server.stop();
  }

  public static readonly ShutdownSignals = ["SIGINT", "SIGTERM", "beforeExit"];

  private handleShutdown = ((...args: any) => {
    this.logger.info(`shutdown signal received: ${args}`);
    return this.stop();
  }).bind(this);

  private handleError = ((reason: {} | null | undefined, promise?: Promise<any>) => {
    this.logger.error(reason);
    if (reason instanceof FatalError) {
      return this.stop();
    }
  }).bind(this);
}

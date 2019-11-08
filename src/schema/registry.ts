import { EventEmitter } from "events";
import AsyncLock from "async-lock";
import * as kleur from "kleur";
import _ from "lodash";
import { FatalError } from "tslint/lib/error";
import { RecursivePartial, hash, validateObject, ValidationSchema, ValidationError, validateInlineFunction } from "../interface";
import { Reporter, Service, ServiceBroker } from "../broker";
import { Logger } from "../logger";
import { ServiceAPIIntegrationSource } from "./integration";
import { ServiceAPISchema, ServiceMetaDataSchema } from "./index";
import { Branch, BranchOptions } from "./branch";
import { ProtocolPlugin, PolicyPlugin, SchemaPluginConstructors, SchemaPluginConstructorOptions, defaultSchemaPluginConstructorOptions } from "./plugin";

export type SchemaRegistryProps = {
  brokers: Array<Readonly<ServiceBroker>>,
  logger: Logger,
};

export type SchemaRegistryOptions = {
  branch: BranchOptions,
} & SchemaPluginConstructorOptions;

export type SchemaRegistryListeners = {
  updated: (branch: Branch) => void,
  removed: (branch: Branch) => void,
};

export class SchemaRegistry {
  private static Event = {
    Updated: "updated",
    Removed: "removed",
  };
  private readonly plugin: {
    protocol: Array<ProtocolPlugin<any, any>>,
    policy: Array<PolicyPlugin<any, any>>,
  };
  private readonly branchMap = new Map<string, Branch>();
  private readonly branchOptions?: RecursivePartial<BranchOptions>;
  private readonly emitter = new EventEmitter().setMaxListeners(1);

  constructor(protected props: SchemaRegistryProps, opts?: RecursivePartial<SchemaRegistryOptions>) {
    // adjust options
    this.branchOptions = opts && opts.branch;
    const { protocol = {}, policy = {} } = opts || {};
    const pluginConstructorOptions: SchemaPluginConstructorOptions = _.defaultsDeep({protocol, policy}, defaultSchemaPluginConstructorOptions);

    // initiate all plugins
    this.plugin = {protocol: [], policy: []};

    for (const [pluginKey, pluginOptions] of Object.entries(pluginConstructorOptions.policy)) {
      if (pluginOptions === false) {
        continue;
      }
      const PluginConstructor = SchemaPluginConstructors.policy[pluginKey as keyof SchemaPluginConstructorOptions["policy"]];
      if (!PluginConstructor) {
        continue;
      }
      this.plugin.policy.push(new PluginConstructor({
        logger: this.props.logger.getChild(`policy/${pluginKey}`),
      }, pluginOptions));
    }

    for (const [pluginKey, pluginOptions] of Object.entries(pluginConstructorOptions.protocol)) {
      if (pluginOptions === false) {
        continue;
      }
      const PluginConstructor = SchemaPluginConstructors.protocol[pluginKey as keyof SchemaPluginConstructorOptions["protocol"]];
      if (!PluginConstructor) {
        continue;
      }
      this.plugin.protocol.push(new PluginConstructor({
        logger: this.props.logger.getChild(`protocol/${pluginKey}`),
        policyPlugins: this.plugin.policy,
      }, pluginOptions));
    }
  }

  /* registry lifecycle */
  public async start(listeners: SchemaRegistryListeners): Promise<void> {

    // start plugins
    for (const plugin of this.plugin.policy) {
      await plugin.start();
    }
    this.props.logger.info(`schema policy plugin has been started: ${this.plugin.policy.join(", ")}`);

    for (const plugin of this.plugin.protocol) {
      await plugin.start();
    }
    this.props.logger.info(`schema protocol plugin has been started: ${this.plugin.protocol.join(", ")}`);

    // initialize branch event handler
    this.emitter.on(SchemaRegistry.Event.Updated, listeners.updated);
    this.emitter.on(SchemaRegistry.Event.Removed, listeners.removed);

    // initialize unused branch clearer
    this.clearUnusedBranchesIntervalTimer = setInterval(this.clearUnusedBranches.bind(this), 5 * 1000);

    // start master branch
    await this.findOrCreateBranch(Branch.Master);

    this.props.logger.info("schema registry has been started");

    // start brokers and initialize discovery handler
    for (const broker of this.props.brokers) {
      await broker.start({
        connected: this.serviceConnected.bind(this),
        disconnected: this.serviceDisconnected.bind(this),
        nodePoolUpdated: this.serviceNodePoolUpdated.bind(this),
      });
    }
  }

  public async stop(): Promise<void> {
    // clear resources
    if (this.clearUnusedBranchesIntervalTimer) {
      clearInterval(this.clearUnusedBranchesIntervalTimer);
    }
    this.emitter.removeAllListeners();
    this.branchMap.clear();

    // stop branches
    for (const branch of this.getBranches()) {
      await branch.stop();
    }

    // stop plugins
    for (const plugin of [...this.plugin.protocol, ...this.plugin.policy]) {
      await plugin.stop();
    }

    this.props.logger.info("schema registry has been stopped");

    // stop broker and clear discovery handler
    for (const broker of this.props.brokers) {
      await broker.stop();
    }
  }

  /* service discovery */
  private lock = new AsyncLock({maxPending: 1000, timeout: 30 * 1000});
  private serviceReporterMap = new Map<Readonly<Service>, Reporter>();

  private serviceConnected(service: Readonly<Service>): void {
    this.lock.acquire("discovery", async () => {
      this.props.logger.info(`${service} service has been connected`);

      const reporter = service.broker!.createReporter(service);
      this.serviceReporterMap.set(service, reporter);

      let integration: ServiceAPIIntegrationSource | null = null;
      const meta = service.meta as ServiceMetaDataSchema | null;

      // if has published service API
      if (meta && meta.api) {

        // validate service API schema
        const schema = meta.api;
        const errors = this.validateServiceAPISchema(schema);

        if (errors.length > 0) {
          errors.forEach(err => reporter.error(err));
          const at = new Date();
          const errorsTable = Reporter.getTable(errors.map(message => ({ type: "error", message, at })));
          this.props.logger.error(`failed to validate ${service} API schema: ${errorsTable}`);
        } else {
          // create integration source
          integration = {schema, schemaHash: this.hashServiceAPISchema(schema), service, reporter};

          // assure new branch creation
          await this.findOrCreateBranch(schema.branch);
        }
      }

      // connect service to each branches' latest version
      for (const branch of this.branchMap.values()) {
        await branch.connectService(service, integration);
      }
    })
      .catch(error => {
        if (error instanceof FatalError) throw error;
        this.props.logger.error(`failed to connect ${service} service`, error);
      });
  }

  private serviceDisconnected(service: Readonly<Service>): void {
    this.lock.acquire("discovery", async () => {
      this.props.logger.info(`${service} service has been disconnected`);

      // disconnect service from each branches' latest version
      for (const branch of this.branchMap.values()) {
        await branch.disconnectService(service);
      }

      this.serviceReporterMap.delete(service);
    })
      .catch(error => {
        if (error instanceof FatalError) throw error;
        this.props.logger.error(`failed to disconnect ${service} service`, error);
      });
  }

  private serviceNodePoolUpdated(service: Readonly<Service>): void {
    this.props.logger.info(`${service} service node pool has been updated`);
  }

  /* schema management */
  private validateServiceAPISchema(schema: Readonly<ServiceAPISchema>): ValidationError[] {
    const errors = validateObject(schema, {
      branch: {
        type: "string",
        alphadash: true,
        empty: false,
      },
      protocol: {
        type: "object",
        // do not [strict: true,] for plugin deprecation
        optional: false,
        props: this.plugin.protocol.reduce((props, plugin) => {
          props[plugin.key] = {
            type: "custom",
            optional: true,
            check(value) {
              const errs = plugin.validateSchema(value);
              return errs.length === 0 ? true : errs.map(err => {
                err.field = `api.protocol.${plugin.key}.${err.field}`;
                return err;
              });
            },
          };
          return props;
        }, {} as ValidationSchema),
      },
      policy: {
        type: "object",
        optional: false,
        props: (["call", "publish", "subscribe"] as Array<"call" | "publish" | "subscribe">).reduce((props, connectorType) => {
          props[connectorType] = {
            type: "array",
            optional: true,
            items: {
              type: "object",
              // do not [strict: true,] for plugin deprecation
              props: this.plugin.policy.reduce((policyItemProps, plugin) => {
                if (policyItemProps[plugin.key]) {
                  return policyItemProps;
                }
                policyItemProps[plugin.key] = {
                  type: "custom",
                  optional: true,
                  check(value) {
                    const idx = schema.policy[connectorType]!.indexOf(value);
                    const errs = plugin.validateSchema(value);
                    return errs.length === 0 ? true : errs.map(err => {
                      err.field = `api.policy.${connectorType}[${idx}].${plugin.key}${err.field ? `.${err.field}` : ""}`;
                      return err;
                    });
                  },
                };
                return policyItemProps;
              }, {
                description: "string",
                [connectorType === "call" ? "actions" : "events"]: {
                  type: "array",
                  items: "string",
                  empty: false,
                },
              } as ValidationSchema),
            },
          };
          return props;
        }, {} as ValidationSchema),
      },
    }, {
      field: "api",
      strict: true,
    });

    // arrange validation errors
    return errors.map(({type, message, field, actual, expected, location, ...otherProps}) => {
      const err = {
        type: kleur.bold(kleur.red(type)),
        message: kleur.yellow(message),
        field: kleur.bold(kleur.cyan(field)),
        expected,
        actual,
        location,
        ...otherProps,
      };
      if (typeof expected === "undefined") {
        delete err.expected;
      }
      if (typeof actual === "undefined") {
        delete err.actual;
      }
      if (typeof location === "undefined") {
        delete err.location;
      }
      return err;
    });
  }

  private hashServiceAPISchema(schema: Readonly<ServiceAPISchema>): string {
    const obj: any = _.cloneDeepWith(schema, (value, field) => {
      switch (field) {
        // ignore descriptive fields
        case "description":
          if (typeof value === "string" && !validateInlineFunction(value)) {
            return null;
          }
          return value;
        case "deprecated":
          if (typeof value === "boolean") {
            return null;
          }
          return value;
        default:
          return value;
      }
    });
    return hash(obj, true);
  }

  /* branch management */
  private async findOrCreateBranch(branchName: string): Promise<Readonly<Branch>> {
    branchName = branchName.toLowerCase();
    if (!this.branchMap.has(branchName)) {
      let branch: Branch;

      // initial branches inherit latest version of master branch
      const parentBranch = this.branchMap.get(Branch.Master);
      if (parentBranch) {
        branch = await parentBranch.fork({
          name: branchName,
          logger: this.props.logger.getChild(branchName),
        });
      } else {
        // create whole new branch (master branch)
        branch = new Branch({
          name: branchName,
          logger: this.props.logger.getChild(branchName),
          protocolPlugins: this.plugin.protocol,
        }, this.branchOptions);
      }

      await branch.start({
        started: () => {
          this.props.logger.info(`${branch} branch has been created`);
          this.emitter.emit(SchemaRegistry.Event.Updated, branch);
        },
        updated: () => {
          this.props.logger.info(`${branch} branch has been updated`);
          this.emitter.emit(SchemaRegistry.Event.Updated, branch);
        },
        removed: () => {
          this.props.logger.info(`${branch} branch has been removed`);
          this.emitter.emit(SchemaRegistry.Event.Updated, branch);
        },
      });

      this.branchMap.set(branchName, branch);
    }
    return this.branchMap.get(branchName)!;
  }

  public getBranch(branchName: string): Readonly<Branch> | null {
    return this.branchMap.get(branchName.toLowerCase()) || null;
  }

  public getBranches(): Array<Readonly<Branch>> {
    return Array.from(this.branchMap.values());
  }

  public deleteBranch(branchName: string): Promise<boolean> {
    return this.$deleteBranch(branchName, true);
  }

  private async $deleteBranch(branchName: string, force: boolean): Promise<boolean> {
    branchName = branchName.toLowerCase();
    const branch = this.branchMap.get(branchName);
    if (!branch || branch.isMaster || (!branch.isUnused && !force)) {
      return false;
    }
    await branch.stop();
    this.branchMap.delete(branchName);
    this.props.logger.info(`${branch.name} branch has been ${force ? "manually " : "automatically"} deleted (unused for ${branch.unusedSeconds >= 60 ? `${Math.floor(branch.unusedSeconds / 60)}min` : `${branch.unusedSeconds}sec`})`);
    return true;
  }

  private clearUnusedBranchesIntervalTimer?: NodeJS.Timeout;

  private clearUnusedBranches(): void {
    for (const branch of this.branchMap.values()) {
      this.$deleteBranch(branch.name, false);
    }
  }
}

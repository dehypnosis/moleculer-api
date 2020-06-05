import AsyncLock from "async-lock";
import { EventEmitter } from "events";
import * as kleur from "kleur";
import * as _ from "lodash";
import { FatalError } from "tslint/lib/error";
import { Reporter, Service } from "../broker";
import { RecursivePartial, ValidationError } from "../interface";
import { Logger } from "../logger";
import { ServiceCatalog } from "./catalog";
import { ProtocolPlugin } from "./plugin";
import { ServiceAPIIntegration, ServiceAPIIntegrationSource } from "./integration";
import { HTTPRouteHandler, Route } from "../server";
import { Version } from "./version";

export type BranchProps = {
  name: string;
  logger: Logger;
  protocolPlugins: ReadonlyArray<ProtocolPlugin<any, any>>;
  parentVersion?: Readonly<Version>;
  serviceCatalog?: ServiceCatalog;
};

export type BranchOptions = {
  maxVersions: number;
  maxUnusedSeconds: number;
};

const {Add, Remove} = ServiceAPIIntegration.Type;

export class Branch {
  public static readonly Master = "master";
  public static readonly Event = {
    Updated: "updated",
    Removed: "removed",
  };
  private static lock = new AsyncLock({maxPending: 1000, timeout: 30 * 1000});
  private readonly opts: BranchOptions;
  private readonly serviceCatalog: ServiceCatalog;
  private $latestVersion: Readonly<Version>;
  private emitter = new EventEmitter().setMaxListeners(1);

  constructor(protected readonly props: BranchProps, opts?: RecursivePartial<BranchOptions>) {
    // setup initial or forked branch
    this.serviceCatalog = props.serviceCatalog || new ServiceCatalog();
    this.$latestVersion = props.parentVersion || Version.initialVersion;

    // forget it
    delete props.serviceCatalog;
    delete props.parentVersion;

    // adjust options
    this.opts = _.defaultsDeep(opts || {}, {
      maxVersions: 10,
      maxUnusedSeconds: 60 * 30,
    });
    this.opts.maxVersions = isNaN(this.opts.maxVersions) ? 10 : Math.max(this.opts.maxVersions, 1);
    this.opts.maxUnusedSeconds = isNaN(this.opts.maxUnusedSeconds) ? 60 * 30 : Math.max(this.opts.maxUnusedSeconds, 1);
  }

  public toString(): string {
    return `${kleur.bold(kleur.cyan(this.name))} ${kleur.cyan(`(${this.serviceCatalog.size} services)`)}`;
  }

  public get information() {
    return {
      branch: this.name,
      latestUsedAt: this.latestUsedAt,
      services: this.serviceCatalog.services.map(service => service.information),
      parentVersion: this.props.parentVersion ? this.props.parentVersion.shortHash : null,
      latestVersion: this.$latestVersion.shortHash,
      versions: this.versions.map(v => v.information),
    };
  };

  public get name() {
    return this.props.name;
  }

  public get isMaster() {
    return this.name === Branch.Master;
  }

  /* garbage detector */
  private latestUsedAt = new Date();

  public get isUnused(): boolean {
    return this.unusedSeconds > this.opts.maxUnusedSeconds;
  }

  public get unusedSeconds(): number {
    return Math.floor((new Date().getTime() - this.latestUsedAt.getTime()) / 1000);
  }

  public touch(): void { // should touched from server
    this.latestUsedAt = new Date();
  }

  /* services */
  public get services(): Readonly<Service>[] {
    return this.serviceCatalog.services;
  }

  /* versions */
  public get latestVersion(): Readonly<Version> {
    return this.$latestVersion;
  }

  public get versions(): ReadonlyArray<Readonly<Version>> {
    const versions = [];
    let version = this.$latestVersion;
    do {
      versions.push(version);
      version = version.parentVersion!;
    } while (version);
    return versions;
  }

  public fork(props: { logger: Logger; name: string }): Promise<Branch> {
    // wait until queue empty and all on-going integration be progressed
    return Branch.lock.acquire(props.name, () => {
      return Branch.lock.acquire(this.name, () => {
        return new Branch({
          ...this.props,
          name: props.name,
          logger: props.logger,
          parentVersion: this.$latestVersion,
          serviceCatalog: this.serviceCatalog.clone(),
        }, this.opts);
      });
    });
  }

  /*
    service discovery priority rule:
    master branch can see and prefer: master-branched > non-branched services
    other branch can see and prefer: own-branched > master-branched > non-branched services
  */
  public connectService(service: Readonly<Service>, integration: ServiceAPIIntegrationSource | null): Promise<void> {
    return Branch.lock.acquire(this.name, () => {
      let priority: number;
      if (!integration) {
        priority = 1;
      } else if (integration.schema.branch === Branch.Master) {
        priority = 2;
      } else if (integration.schema.branch === this.name) {
        priority = 3;
      } else {
        this.props.logger.info(`${this} branch ignores ${service} service connection`);
        return;
      }

      // update service catalog
      const oldItem = this.serviceCatalog.get(service.id);
      this.serviceCatalog.add({service, integration, priority});
      const newItem = this.serviceCatalog.get(service.id)!;
      this.props.logger.info(`${this} branch connected ${newItem.service} service`);

      // on preferred service changes
      if (oldItem !== newItem) {
        if (oldItem) {
          this.props.logger.info(`${this} branch disconnected ${oldItem.service} service`);
        }

        // integrate API if has
        const integrations: ServiceAPIIntegration[] = [];
        if (oldItem && oldItem.integration) {
          integrations.push(new ServiceAPIIntegration({
            type: Remove,
            serviceCatalog: this.serviceCatalog,
            source: oldItem.integration,
          }));
        }
        if (newItem.integration) {
          integrations.push(new ServiceAPIIntegration({
            type: Add,
            serviceCatalog: this.serviceCatalog,
            source: newItem.integration,
          }));
        }
        if (integrations.length > 0) {
          return this.consumeIntegrations(integrations);
        }
      }
    });
  }

  public disconnectService(service: Readonly<Service>): Promise<void> {
    return Branch.lock.acquire(this.name, async () => {
      const oldItem = this.serviceCatalog.get(service.id)!;
      if (!this.serviceCatalog.remove(service)) {
        this.props.logger.info(`${this} branch ignores ${service} service disconnection`);
        return;
      }
      this.props.logger.info(`${this} branch disconnected ${oldItem.service} service`);

      // on preferred service changes
      const newItem = this.serviceCatalog.get(service.id);
      if (oldItem !== newItem) {
        if (newItem) {
          this.props.logger.info(`${this} branch connected ${newItem.service} service`);
        }

        // integrate API if has
        const integrations: ServiceAPIIntegration[] = [];
        if (oldItem.integration) {
          integrations.push(new ServiceAPIIntegration({
            type: Remove,
            serviceCatalog: this.serviceCatalog,
            source: oldItem.integration,
          }));
        }
        if (newItem && newItem.integration) {
          integrations.push(new ServiceAPIIntegration({
            type: Add,
            serviceCatalog: this.serviceCatalog,
            source: newItem.integration,
          }));
        }
        if (integrations.length > 0) {
          await this.consumeIntegrations(integrations);
        }
      }
    });
  }

  /* schema integration */
  private async consumeIntegrations(integrations: Readonly<ServiceAPIIntegration>[], initialCompile = false): Promise<void> {
    try {
      const parentVersion = this.$latestVersion;

      // get queue jobs and filter add/remove pairs
      const compensatedIntegrations = integrations.filter(integration => {
        return integrations
          .some(int => int.schemaHash === integration.schemaHash && (int.type === Add && integration.type === Remove || int.type === Remove && integration.type === Add));
      });
      if (compensatedIntegrations.length > 0) {
        for (const integration of compensatedIntegrations) {
          integrations.splice(integrations.indexOf(integration), 1);
          integration.setSucceed(this, parentVersion);
        }
        this.props.logger.info(`${this} branch ignores complementary integrations:\n${compensatedIntegrations.join("\n")}`);
      }

      // retry failed jobs or finish
      if (integrations.length === 0 && !initialCompile) {
        return this.retryFailedIntegrationsFrom(parentVersion);
      }

      // create new schemaHashMap and pick up required schemata to compile
      const {schemaHashMap, routeHashMapCache} = parentVersion.getChildVersionProps();
      let shouldCompile = initialCompile;
      for (const integration of integrations) {
        if (integration.type === Add) {
          if (!schemaHashMap.has(integration.schemaHash)) {
            shouldCompile = true;
          }
          schemaHashMap.set(integration.schemaHash, integration); // override schema
        } else if (integration.type === Remove) {
          if (schemaHashMap.has(integration.schemaHash)) {
            shouldCompile = true;
            schemaHashMap.delete(integration.schemaHash); // remove
          }
        } else {
          console.assert(false, "invalid integration type");
        }
      }

      // no changes
      if (!shouldCompile) {
        for (const integration of integrations) {
          integration.setSkipped(this, parentVersion);
        }
        this.props.logger.info(`${this} branch skipped ${parentVersion} -> (new) version compile due to no changes:\n${integrations.concat(compensatedIntegrations).join("\n")}`);

        // retry failed jobs or finish
        return this.retryFailedIntegrationsFrom(parentVersion);
      }

      // compile new schemata as new routeHashMap
      const mergedIntegrations = Array.from(schemaHashMap.values());
      const routeHashes = new Array<string>();
      const routes = new Array<Readonly<Route>>();
      const errors: ValidationError[] = [];
      for (const plugin of this.props.protocolPlugins) {
        try {
          const pluginIntegrations = mergedIntegrations.filter(integration => integration.schema.protocol && (integration.schema.protocol as any)[plugin.key]);
          const pluginResult = plugin.compileSchemata(routeHashMapCache, pluginIntegrations);
          for (const {hash, route} of pluginResult) {
            const routeHashIndex = routeHashes.indexOf(hash);
            if (routeHashIndex !== -1) {
              const existingRoute = routes[routeHashIndex]!;
              errors.push({
                type: "routeHashCollision",
                field: `api.protocol.${plugin.key}`,
                message: `route hash [${hash}] collision occurred between ${existingRoute} and ${route} in ${this.name} branch`,
              });
              continue;
            }

            const conflictRoute = routes.find(r => r.isConflict(route));
            if (conflictRoute) {
              errors.push({
                type: "routeConflict",
                field: `api.protocol.${plugin.key}`,
                message: `route conflict occurred between ${conflictRoute} and ${route} in ${this.name} branch`,
              });
              continue;
            }

            routeHashes.push(hash);
            routes.push(route);
          }
        } catch (error) {
          errors.push({
            type: "compileError",
            field: `api.protocol.${plugin.key}`,
            message: error.message,
          });
        }
      }

      // failed: report errors and process as failed jobs
      if (errors.length > 0) {
        for (const integration of integrations) {
          integration.setFailed(this, parentVersion, errors, integrations);
        }

        if (initialCompile) { // throw errors when failed in initial compile
          throw new FatalError("failed to compile empty schemata initially", errors as any); // TODO: normalize error
        } else {
          const at = new Date();
          const errorsTable = Reporter.getTable(errors.map(message => ({type: "error", message, at})));
          this.props.logger.error(`${this} branch failed ${parentVersion} -> (new) version compile:\n${integrations.join("\n")}${errorsTable}`);
        }

        // will not retry on failure
        return;
      }

      // succeed: report success and create new version
      const routeHashMap = new Map<string, Readonly<Route>>(routeHashes.map((hash, idx) => [hash, routes[idx]]));

      // create new version
      const version = new Version({
        schemaHashMap,
        routeHashMap,
        parentVersion,
      });
      this.$latestVersion = version;

      // report to origin services
      const updatedRoutes: Readonly<Route>[] = [];
      const removedRoutes: Readonly<Route>[] = [];
      for (const [hash, route] of routeHashMap) {
        if (!routeHashMapCache.has(hash)) {
          updatedRoutes.push(route);
        }
      }
      for (const [hash, route] of routeHashMapCache as Map<string, Readonly<Route>>) {
        if (!routeHashMap.has(hash)) {
          removedRoutes.push(route);
        }
      }

      updatedRoutes.sort((a, b) => a.path > b.path && a.protocol > b.protocol ? 1 : 0);
      removedRoutes.sort((a, b) => a.path > b.path && a.protocol > b.protocol ? 1 : 0);

      const updates: string[] = [];
      for (const r of removedRoutes) {
        updates.push(`(-) ${r}`);
      }
      for (const r of updatedRoutes) {
        updates.push(`(+) ${r}`);
      }

      for (const integration of integrations) {
        integration.setSucceed(this, version, updates);
      }

      // log
      this.props.logger.info(`${this} branch succeeded ${parentVersion} -> ${version} version compile:\n${[...integrations, ...updates].join("\n")}`);

      // forget old parent versions if need
      for (let cur = this.$latestVersion, parent = cur.parentVersion, i = 1; parent; cur = parent, parent = cur.parentVersion, i++) {
        // v1 / v2 / 1
        // v2 / v3 / 2
        // v3 / null / 3
        if (i >= this.opts.maxVersions) {
          for (const integration of parent.integrations) {
            integration.reportRemoved(this, cur);
          }
          cur.forgetParentVersion();
          this.props.logger.info(`${this} branch have forgotten versions older than ${cur}`);
          break;
        }
      }

      // emit routes update event
      this.emitter.emit(Branch.Event.Updated);

      // retry failed jobs or finish
      return this.retryFailedIntegrationsFrom(parentVersion);
    } catch (error) {
      if (error instanceof FatalError) {
        throw error;
      }
      this.props.logger.error(`${this} branch failed to process integration jobs:\n${integrations.join("\n")}`, error);
    }
  }

  private async retryFailedIntegrationsFrom(version: Readonly<Version>): Promise<void> {
    // retry merging failed integrations from history
    const retryableIntegrations = version.getRetryableIntegrations();
    if (retryableIntegrations.length > 0) {
      this.props.logger.info(`${this} branch will retry merging ${retryableIntegrations.length} failed integrations`);
      return this.consumeIntegrations(retryableIntegrations, false);
    }
  }

  /* lifecycle (updated/removed) */
  public start(listener: {
    started: () => void,
    updated: () => void,
    removed: () => void,
  }): Promise<void> {
    return Branch.lock.acquire(this.name, () => {
      this.emitter.on(Branch.Event.Updated, listener.updated);
      this.emitter.on(Branch.Event.Removed, listener.removed);
      listener.started();

      // force compile for master branch initialization
      if (this.isMaster) {
        return this.consumeIntegrations([], true);
      }
    });
  }

  public stop(): Promise<void> {
    return Branch.lock.acquire(this.name, () => {
      // report version removed
      for (const version of this.versions) {
        for (const integration of version.integrations) {
          integration.reportRemoved(this, version);
        }
      }

      this.emitter.emit(Branch.Event.Removed);
      this.emitter.removeAllListeners();
    });
  }
}

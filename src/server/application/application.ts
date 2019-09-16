import * as _ from "lodash";
import AsyncLock from "async-lock";
import { FatalError } from "tslint/lib/error";
import { RecursivePartial } from "../../interface";
import { Logger } from "../../logger";
import { Branch, Version } from "../../schema";
import { ServerApplicationComponent, ServerApplicationComponentConstructorOptions, ServerApplicationComponentConstructors, ServerApplicationComponentModules } from "./component";
import { BranchHandlerMap, Route, RouteHandlerMap } from "./component/route";

export type ServerApplicationProps = {
  logger: Logger;
};

export type ServerApplicationOptions = {} & ServerApplicationComponentConstructorOptions;

export class ServerApplication {
  public readonly components: ReadonlyArray<ServerApplicationComponent<Route>>;
  private readonly componentBranchHandlerMap = new Map<ServerApplicationComponent<Route>, BranchHandlerMap<Route>>();

  constructor(protected readonly props: ServerApplicationProps, opts?: RecursivePartial<ServerApplicationOptions>) {
    // create application components
    this.components = Object.entries(ServerApplicationComponentConstructors).reduce((components, [compKey, Component]) => {
      const key = compKey as keyof ServerApplicationComponentConstructorOptions;
      return components.concat(new Component({
        logger: this.props.logger.getChild(`${key}`),
      }, opts && opts[key]));
    }, [] as Array<ServerApplicationComponent<Route>>);

    // create branch handler map for each components
    for (const component of this.components) {
      this.componentBranchHandlerMap.set(component, new Map());
    }
  }

  // modules map of each application components which are passed to protocols
  public get componentModules(): ServerApplicationComponentModules {
    return this.components.reduce((obj, component) => {
      obj[component.key as keyof ServerApplicationComponentModules] = component.module;
      return obj;
    }, {} as ServerApplicationComponentModules);
  }

  /* lifecycle */
  public async start(): Promise<void> {
    for (const component of this.components) {
      await component.start();
    }
    this.props.logger.info(`gateway server application has been started: ${this.components.join(", ")}`);
  }

  public async stop(): Promise<void> {
    for (const component of this.components) {
      await component.stop();
    }
    this.componentBranchHandlerMap.clear();
    this.props.logger.info(`gateway server application has been stopped: ${this.components.join(", ")}`);
  }

  /* handler update */
  private readonly lock = new AsyncLock({maxPending: 1000, timeout: 1000});

  public async mountBranchHandler(branch: Branch): Promise<void> {
    await Promise.all(this.components.map(async component => {
      return this.lock.acquire(component.key, () => {
        // get version handler map
        const branchHandlerMap = this.componentBranchHandlerMap.get(component)!;
        if (!branchHandlerMap) {
          return;
        }
        const versionHandlerMap = branchHandlerMap.get(branch) || new Map<Readonly<Version>, RouteHandlerMap<Route>>();

        // unmount old versions
        const newVersions = branch.versions; // latest -> oldest versions
        for (const [version, routeHandlerMap] of versionHandlerMap.entries()) {
          // clear forgotten version or prev-latest version
          if (!newVersions.includes(version) || version === branch.latestVersion.parentVersion) {
            component.unmountRoutes(routeHandlerMap);
            versionHandlerMap.delete(version);
          }
        }

        // mount versions
        const routeMatched = _.debounce(() => branch.touch(), 1000, {maxWait: 1000 * 50}); // when matched, branch lastUsedAt shall be updated
        for (const version of newVersions) {
          if (!versionHandlerMap.has(version)) {
            // prepare mount path
            const {branchPathPrefix, versionPathPrefix} = Route;
            const pathPrefixes: string[] = [`/${branchPathPrefix}${branch.name}${versionPathPrefix}${version.shortHash}`]; // ~dev@abcd1234
            if (branch.latestVersion === version) {
              pathPrefixes.unshift(`/${branchPathPrefix}${branch.name}`); // ~dev
              if (branch.isMaster) {
                pathPrefixes.unshift(`/`);
              }
            }

            // create route handlers and mount
            const routes = version.routes.filter(component.canHandleRoute.bind(component));
            const routeHandlerMap = component.mountRoutes(routes, pathPrefixes, routeMatched);
            versionHandlerMap.set(version, routeHandlerMap);
          }
        }

        branchHandlerMap.set(branch, versionHandlerMap);
        this.props.logger.info(`${branch} handler mounted for ${component} component`);
      })
        .catch(error => {
          if (error instanceof FatalError) {
            throw error;
          }
          this.props.logger.error(`failed to mount ${branch} handler for ${component}: ${error}`);
        });
    }));
  }

  public async unmountBranchHandler(branch: Branch): Promise<void> {
    await Promise.all(this.components.map(async component => {
      return this.lock.acquire(component.key, () => {
        // get branch handlers map
        const branchHandlerMap = this.componentBranchHandlerMap.get(component)!;
        if (!branchHandlerMap) {
          return;
        }
        const versionHandlerMap = branchHandlerMap.get(branch);
        if (!versionHandlerMap) {
          return;
        }

        // remove all version handlers
        for (const [version, routeHandlerMap] of versionHandlerMap.entries()) {
          component.unmountRoutes(routeHandlerMap);
          versionHandlerMap.delete(version);
        }

        // clear resources
        versionHandlerMap.clear();
        branchHandlerMap.delete(branch);
        this.props.logger.info(`${branch} handler unmounted for ${component}`);
      })
        .catch(error => {
          if (error instanceof FatalError) {
            throw error;
          }
          this.props.logger.info(`failed to unmount ${branch} handler for ${component}`, error);
        });
    }));
  }
}

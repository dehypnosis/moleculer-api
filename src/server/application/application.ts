import AsyncLock from "async-lock";
import { FatalError, RecursivePartial } from "../../interface";
import { Logger } from "../../logger";
import { Branch, Version } from "../../schema";
import {
  Route,
  BranchHandlerMap,
  RouteHandlerMap,
  ServerApplicationComponent,
  ServerApplicationComponentConstructorOptions,
  ServerApplicationComponentConstructors,
  ServerApplicationComponentModules
} from "./component";
import { APIRequestContext, APIRequestContextFactory } from "./context";

export type ServerApplicationProps = {
  logger: Logger;
  contextFactories: ReadonlyArray<APIRequestContextFactory<any>>;
};

export type ServerApplicationOptions = {} & ServerApplicationComponentConstructorOptions;

export class ServerApplication {
  public readonly components: ReadonlyArray<ServerApplicationComponent<Route>>;
  private readonly componentBranchHandlerMap = new Map<ServerApplicationComponent<Route>, BranchHandlerMap<Route>>();
  private readonly componentsAliasedVersions = new Map<ServerApplicationComponent<Route>, Readonly<Version>[]>();
  private readonly staticRoutes: Route[] = [];

  constructor(protected readonly props: ServerApplicationProps, opts?: RecursivePartial<ServerApplicationOptions>) {
    // create application components
    this.components = Object.entries(ServerApplicationComponentConstructors).reduce((components, [compKey, Component]) => {
      const key = compKey as keyof ServerApplicationComponentConstructorOptions;
      return components.concat(new Component({
        logger: this.props.logger.getChild(`${key}`),
      }, opts && opts[key]));
    }, [] as ServerApplicationComponent<Route>[]);

    // create branch handler map for each components
    for (const component of this.components) {
      this.componentBranchHandlerMap.set(component, new Map());
      this.componentsAliasedVersions.set(component, []);
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
        const versionHandlerMap = branchHandlerMap.get(branch) || new Map<Readonly<Version>, RouteHandlerMap<Route>>();

        // get aliases versions
        const aliasedVersions = this.componentsAliasedVersions.get(component)!;

        // unmount old versions
        const newVersions = branch.versions; // latest -> oldest versions
        for (const [version, routeHandlerMap] of versionHandlerMap.entries()) {
          // clear forgotten version or prev-latest version
          if (!newVersions.includes(version) || aliasedVersions.includes(version)) {
            component.unmountRoutes(routeHandlerMap);
            versionHandlerMap.delete(version);
          }
        }

        // prepare context creation
        const createContext = APIRequestContext.createConstructor(this.props.contextFactories, {
          before(source) {
            branch.touch();
            // console.log("create context with ", source);
          },
          // after(source, context) {
          //   console.log(`${component} ${source.method} ${source.url}`);
          // },
        });

        // mount new versions
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

              // remember aliased versions to unmount it later when alias should be removed
              aliasedVersions.push(version);
            }

            // create route handlers and mount
            const routes = [
              ...version.routes,
              ...this.staticRoutes,
            ].filter(component.canHandleRoute.bind(component));
            const routeHandlerMap = component.mountRoutes(routes, pathPrefixes, createContext);
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

    // tslint:disable-next-line:no-shadowed-variable
    // this.props.logger.info("\n" + this.routes.map(({branch, version, route}) => `/~${branch.name}@${version.shortHash}${route}`).join("\n"));
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

  public addStaticRoute(route: Route) {
    this.staticRoutes.push(route);
    return this;
  }

  public get routes() {
    const items: { branch: Readonly<Branch>, version: Readonly<Version>, route: Readonly<Route> }[] = [];
    for (const branchHandlerMap of this.componentBranchHandlerMap.values()) {
      for (const [branch, versionHandlerMap] of branchHandlerMap.entries()) {
        for (const [version, routeHandlerMap] of versionHandlerMap.entries()) {
          for (const route of routeHandlerMap.keys()) {
            items.push({branch, version, route});
          }

          // add static routes
          items.push(...this.staticRoutes.map(route => ({ branch, version, route })));
        }
      }
    }
    return items;
  }
}

import * as kleur from "kleur";
import pathToRegExp from "path-to-regexp";
import { Branch, Version } from "../../../schema";

export type BranchHandlerMap<ApplicationRoute extends Route> = Map<Readonly<Branch>, VersionHandlerMap<ApplicationRoute>>;

export type VersionHandlerMap<ApplicationRoute extends Route> = Map<Readonly<Version>, Readonly<RouteHandlerMap<ApplicationRoute>>>;

export type RouteHandlerMap<ApplicationRoute extends Route> = Map<Readonly<ApplicationRoute>, RouteInternalHandler>;

export type RouteInternalHandler = (...args: any[]) => void;

export type RouteHandler<Context = any> = (context: Context, ...args: any[]) => void;

export type RouteProps = {
  protocol: string;
  path: string;
  description: string | null;
  handler: RouteHandler<any>;
};

export abstract class Route {
  public static readonly branchPathPrefix = "~";
  public static readonly versionPathPrefix = "@";

  /*
    Route.path is dependent to path-to-regexp module
    ref: https://www.npmjs.com/package/path-to-regexp
  */
  public static readonly nonRootStaticPathRegExp = /^(\/[0-9a-z_\-+~.]+)+$/i;

  public static isNonRootStaticPath(path: string): boolean {
    return typeof path === "string" && Route.nonRootStaticPathRegExp.test(path);
  }

  public static readonly nonRootDynamicPath = /^(\/[0-9a-z_\-+=?:;~@^!$%*()\\\.,]+)+$/i;

  public static isNonRootDynamicPath(path: string): boolean {
    return typeof path === "string" && Route.nonRootDynamicPath.test(path);
  }

  public static readonly rootStaticPathRegExp = /^\/$/i;

  public static isRootStaticPath(path: string): boolean {
    return typeof path === "string" && Route.rootStaticPathRegExp.test(path);
  }

  constructor(protected readonly props: RouteProps) {
  }

  public get protocol() {
    return this.props.protocol;
  }

  public get path() {
    return this.props.path;
  }

  public static mergePaths(...paths: string[]): string {
    return "/" + paths.join("/").split("/").filter(p => !!p).join("/");
  }

  public readonly paramKeys: pathToRegExp.Key[] = [];
  private paramKeysCollected = false;
  public getPathRegExps(prefixes: string[]): RegExp[] {
    return prefixes.map(prefix => {
      const path = Route.mergePaths(prefix, this.path);
      let paramKeys: pathToRegExp.Key[] | undefined;
      if (!this.paramKeysCollected) {
        this.paramKeysCollected = true;
        paramKeys = this.paramKeys;
      }
      return pathToRegExp(path, paramKeys, {
        sensitive: false,
        strict: false,
        end: true,
        start: true,
      });
    });
  }

  public get handler() {
    return this.props.handler;
  }

  public isConflict(route: Readonly<Route>): boolean {
    return this.protocol === route.protocol && this.path.toLowerCase() === route.path.toLowerCase();
  }

  public toString(): string {
    return kleur.cyan(`${this.path} (${this.protocol})${this.props.description ? ": " + kleur.dim(this.props.description) : ""}`);
  }
}

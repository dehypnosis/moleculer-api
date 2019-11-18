import pathToRegExp from "path-to-regexp";
import { Branch, Version } from "../../../schema";
export declare type BranchHandlerMap<ApplicationRoute extends Route> = Map<Readonly<Branch>, VersionHandlerMap<ApplicationRoute>>;
export declare type VersionHandlerMap<ApplicationRoute extends Route> = Map<Readonly<Version>, Readonly<RouteHandlerMap<ApplicationRoute>>>;
export declare type RouteHandlerMap<ApplicationRoute extends Route> = Map<Readonly<ApplicationRoute>, RouteInternalHandler>;
export declare type RouteInternalHandler = (...args: any[]) => void;
export declare type RouteHandler<Context = any> = (context: Context, ...args: any[]) => void;
export declare type RouteProps = {
    protocol: string;
    path: string;
    description: string | null;
    handler: RouteHandler<any>;
};
export declare abstract class Route {
    protected readonly props: RouteProps;
    static readonly branchPathPrefix = "~";
    static readonly versionPathPrefix = "@";
    static readonly nonRootStaticPathRegExp: RegExp;
    static isNonRootStaticPath(path: string): boolean;
    static readonly nonRootDynamicPath: RegExp;
    static isNonRootDynamicPath(path: string): boolean;
    static readonly rootStaticPathRegExp: RegExp;
    static isRootStaticPath(path: string): boolean;
    constructor(props: RouteProps);
    readonly protocol: string;
    readonly path: string;
    static mergePaths(...paths: string[]): string;
    readonly paramKeys: pathToRegExp.Key[];
    private paramKeysCollected;
    getPathRegExps(prefixes: string[]): RegExp[];
    readonly handler: RouteHandler<any>;
    isConflict(route: Readonly<Route>): boolean;
    toString(): string;
}

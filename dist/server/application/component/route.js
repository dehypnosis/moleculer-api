"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Route = void 0;
const tslib_1 = require("tslib");
const kleur = tslib_1.__importStar(require("kleur"));
const path_to_regexp_1 = require("path-to-regexp");
const interface_1 = require("../../../interface");
class Route {
    constructor(props) {
        this.props = props;
        this.paramKeys = [];
        this.paramKeysCollected = false;
    }
    static isNonRootStaticPath(path) {
        return typeof path === "string" && Route.nonRootStaticPathRegExp.test(path);
    }
    static isNonRootDynamicPath(path) {
        return typeof path === "string" && Route.nonRootDynamicPath.test(path);
    }
    static isRootStaticPath(path) {
        return typeof path === "string" && Route.rootStaticPathRegExp.test(path);
    }
    get information() {
        return interface_1.removeANSIColor(this.toString());
    }
    get protocol() {
        return this.props.protocol;
    }
    get path() {
        return this.props.path;
    }
    static mergePaths(...paths) {
        return "/" + paths.join("/").split("/").filter(p => !!p).join("/");
    }
    getPathRegExps(prefixes) {
        return prefixes.map(prefix => {
            const path = Route.mergePaths(prefix, this.path);
            let paramKeys;
            if (!this.paramKeysCollected) {
                this.paramKeysCollected = true;
                paramKeys = this.paramKeys;
            }
            return path_to_regexp_1.pathToRegexp(path, paramKeys, {
                sensitive: false,
                strict: false,
                end: true,
                start: true,
            });
        });
    }
    get handler() {
        return this.props.handler;
    }
    isConflict(route) {
        return this.protocol === route.protocol && this.path.toLowerCase() === route.path.toLowerCase();
    }
    toString() {
        return kleur.cyan(`${this.path} (${this.protocol})${this.props.description ? ": " + kleur.dim(this.props.description) : ""}`);
    }
}
exports.Route = Route;
Route.branchPathPrefix = "~";
Route.versionPathPrefix = "@";
/*
  Route.path is dependent to path-to-regexp module
  ref: https://www.npmjs.com/package/path-to-regexp
*/
Route.nonRootStaticPathRegExp = /^(\/[0-9a-z_\-+~.]+)+$/i;
Route.nonRootDynamicPath = /^(\/[0-9a-z_\-+=?:;~@^!$%*()\\\.,]+)+$/i;
Route.rootStaticPathRegExp = /^\/$/i;
//# sourceMappingURL=route.js.map
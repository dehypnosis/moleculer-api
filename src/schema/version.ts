import * as kleur from "kleur";
import { hashObject } from "../interface";
import { Route } from "../server";
import { ServiceAPIIntegration } from "./integration";

export type VersionProps = {
  // schemaHash -> ServiceAPIIntegration
  schemaHashMap: Map<string, Readonly<ServiceAPIIntegration>>;

  // routeHash -> Route
  routeHashMap: Map<string, Readonly<Route>>;
  parentVersion: Readonly<Version> | null;
};

export class Version {
  public static readonly initialVersion = new Version({
    schemaHashMap: new Map<string, Readonly<ServiceAPIIntegration>>(),
    routeHashMap: new Map<string, Readonly<Route>>(),
    parentVersion: null,
  });
  public readonly hash: string;
  public readonly shortHash: string;
  private readonly $integrations: Readonly<ServiceAPIIntegration>[] = [];

  constructor(protected readonly props: VersionProps) {
    this.hash = hashObject([...props.schemaHashMap.keys(), ...props.routeHashMap.keys()], false);
    this.shortHash = this.hash.substr(0, 8);
  }

  public toString(): string {
    return kleur.yellow(`${this.shortHash} (${this.props.schemaHashMap.size} schemata, ${this.props.routeHashMap.size} routes)`);
  }

  public getChildVersionProps() {
    return {
      schemaHashMap: new Map<string, Readonly<ServiceAPIIntegration>>(this.props.schemaHashMap),
      routeHashMapCache: this.props.routeHashMap as Readonly<Map<string, Readonly<Route>>>,
    };
  }

  public addIntegrationHistory(integration: Readonly<ServiceAPIIntegration>): void {
    console.assert(integration.status !== "queued", "cannot add unprocessed job to existing version");
    this.$integrations.push(integration);
  }

  public forgetParentVersion(): void {
    this.props.parentVersion = null;
  }

  public get parentVersion(): Readonly<Version> | null {
    return this.props.parentVersion;
  }

  public get routes(): Readonly<Route>[] {
    return Array.from(this.props.routeHashMap.values());
  }

  // all integrations including parent versions
  public get integrations(): ReadonlyArray<Readonly<ServiceAPIIntegration>> {
    return Array.from(this.props.schemaHashMap.values());
  }

  // own integrations derived from current version
  public get derivedIntegrations(): ReadonlyArray<Readonly<ServiceAPIIntegration>> {
    return this.$integrations;
  }

  public getRetryableIntegrations(): Readonly<ServiceAPIIntegration>[] {
    const retryableIntegrations = this.$integrations
      .filter(integration => integration.status !== ServiceAPIIntegration.Status.Succeed && !integration.service.empty);

    for (const integration of retryableIntegrations) {
      this.$integrations.splice(this.$integrations.indexOf(integration), 1);
    }

    return retryableIntegrations.map(integration => integration.clone());
  }
}

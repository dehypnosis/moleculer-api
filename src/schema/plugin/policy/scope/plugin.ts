import * as _ from "lodash";
import { RecursivePartial, validateValue, ValidationError } from "../../../../interface";
import { ServiceAPIIntegration } from "../../../integration";
import { CallPolicyArgs, PublishPolicyArgs, SubscribePolicyArgs } from "../../connector";
import { CallPolicyTester, PolicyPlugin, PolicyPluginProps, PublishPolicyTester, SubscribePolicyTester } from "../plugin";
import { ScopePolicyPluginCatalog, ScopePolicyPluginSchema } from "./schema";

export type ScopePolicyPluginOptions = {
  getScopesFromContext: (context: any) => string[];
};

export class ScopePolicyPlugin extends PolicyPlugin<ScopePolicyPluginSchema, ScopePolicyPluginCatalog> {
  public static readonly key = "scope";
  public static readonly autoLoadOptions: ScopePolicyPluginOptions = {
    getScopesFromContext: (ctx) => {
      return Array.isArray(ctx?.auth?.scope) ? ctx.auth.scope : [];
    },
  };
  private opts: ScopePolicyPluginOptions;

  constructor(protected readonly props: PolicyPluginProps, opts?: RecursivePartial<ScopePolicyPluginOptions>) {
    super(props);
    this.opts = _.defaultsDeep(opts || {}, ScopePolicyPlugin.autoLoadOptions);
  }

  public validateSchema(schema: Readonly<ScopePolicyPluginSchema>): ValidationError[] {
    return validateValue(schema, {
      type: "array",
      items: "string",
      empty: false,
    }, {
      field: "",
    });
  }

  public async start(): Promise<void> {
  }

  public async stop(): Promise<void> {
  }

  public describeSchema(schema: Readonly<ScopePolicyPluginSchema>): ScopePolicyPluginCatalog {
    return {} as ScopePolicyPluginCatalog;
  }

  public compileCallPolicySchemata(schemata: ReadonlyArray<ScopePolicyPluginSchema>, descriptions: ReadonlyArray<string|null>, integration: Readonly<ServiceAPIIntegration>): CallPolicyTester {
    return this.compilePolicySchemata(schemata, descriptions, integration) as CallPolicyTester;
  }

  public compilePublishPolicySchemata(schemata: ReadonlyArray<ScopePolicyPluginSchema>, descriptions: ReadonlyArray<string|null>, integration: Readonly<ServiceAPIIntegration>): PublishPolicyTester {
    return this.compilePolicySchemata(schemata, descriptions, integration) as PublishPolicyTester;
  }

  public compileSubscribePolicySchemata(schemata: ReadonlyArray<ScopePolicyPluginSchema>, descriptions: ReadonlyArray<string|null>, integration: Readonly<ServiceAPIIntegration>): SubscribePolicyTester {
    return this.compilePolicySchemata(schemata, descriptions, integration) as SubscribePolicyTester;
  }

  private compilePolicySchemata(
    requiredScopesList: ReadonlyArray<ScopePolicyPluginSchema>, descriptions: ReadonlyArray<string|null>,
    integration: Readonly<ServiceAPIIntegration>
  ): CallPolicyTester | PublishPolicyTester | SubscribePolicyTester {
    const requiredScopes = [] as string[];
    for (const requiredScopesEntry of requiredScopesList) {
      for (const scope of requiredScopesEntry) {
        if (!requiredScopes.includes(scope)) {
          requiredScopes.push(scope);
        }
      }
    }

    const descriptionsMap = requiredScopes.reduce((map, scope) => {
      const matchedDescriptions: string[] = requiredScopesList.reduce((arr: string[], requiredScopesEntry, index) => {
        const desc = descriptions[index];
        if (desc && requiredScopesEntry.includes(scope)) {
          if (!arr.includes(desc)) {
            arr.push(desc);
          }
        }
        return arr;
      }, [] as string[]);
      map[scope] = matchedDescriptions;
      return map;
    }, {} as {[scope: string]: string[]});

    return (args: Readonly<{ context: any; params: any; }>) => {
      const contextScopes = this.opts.getScopesFromContext(args.context);
      for (const requiredScope of requiredScopes as string[]) {
        if (!contextScopes.includes(requiredScope)) {
          // TODO: normalize error
          const error: any = new Error("permission denied");
          error.statusCode = 401;
          error.expected = requiredScopes;
          error.actual = contextScopes;
          error.description = descriptionsMap[requiredScope];
          throw error;
        }
      }
      return true;
    };
  }
}

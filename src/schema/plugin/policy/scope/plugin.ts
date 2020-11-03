import * as _ from "lodash";
import { RecursivePartial, validateValue, ValidationError } from "../../../../interface";
import { ServiceAPIIntegration } from "../../../integration";
import { CallPolicyArgs } from "../../connector";
import { CallPolicyTester, PolicyPlugin, PolicyPluginProps, PublishPolicyTester, SubscribePolicyTester } from "../plugin";
import { ScopePolicyPluginCatalog, ScopePolicyPluginSchema } from "./schema";

export type ScopePolicyPluginOptions = {
  getScopesFromContext: (context: any) => string[];
};

export class ScopePolicyPlugin extends PolicyPlugin<ScopePolicyPluginSchema, ScopePolicyPluginCatalog> {
  public static readonly key = "scope";
  public static readonly autoLoadOptions: ScopePolicyPluginOptions = {
    getScopesFromContext: (ctx = {}) => {
      return Array.isArray(ctx.auth?.identity?.scope) ? ctx.auth?.identity?.scope : [];
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

  public compileCallPolicySchema(requiredScopes: Readonly<ScopePolicyPluginSchema>, integration: Readonly<ServiceAPIIntegration>): CallPolicyTester {
    return (args: Readonly<CallPolicyArgs>) => {
      const contextScopes = this.opts.getScopesFromContext(args.context);
      for (const requiredScope of requiredScopes) {
        if (!contextScopes.includes(requiredScope)) {
          // TODO: normalize error
          throw new Error(`no permission for ${requiredScope}`);
        }
      }
      return true;
    };
  }

  public compilePublishPolicySchema(requiredScopes: Readonly<ScopePolicyPluginSchema>, integration: Readonly<ServiceAPIIntegration>): PublishPolicyTester {
    return (args) => {
      const contextScopes = this.opts.getScopesFromContext(args.context);
      for (const requiredScope of requiredScopes) {
        if (!contextScopes.includes(requiredScope)) {
          // TODO: normalize error
          throw new Error(`no permission for ${requiredScope}`);
        }
      }
      return true;
    };
  }

  public compileSubscribePolicySchema(requiredScopes: Readonly<ScopePolicyPluginSchema>, integration: Readonly<ServiceAPIIntegration>): SubscribePolicyTester {
    return (args) => {
      const contextScopes = this.opts.getScopesFromContext(args.context);
      for (const requiredScope of requiredScopes) {
        if (!contextScopes.includes(requiredScope)) {
          // TODO: normalize error
          throw new Error(`no permission for ${requiredScope}`);
        }
      }
      return true;
    };
  }
}

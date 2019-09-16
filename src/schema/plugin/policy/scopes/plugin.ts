import * as _ from "lodash";
import { RecursivePartial, validateValue, ValidationError } from "../../../../interface";
import { CallPolicyArgs, PublishPolicyArgs, SubscribePolicyArgs } from "../../connector/schema";
import { PolicyPlugin, PolicyPluginProps } from "../plugin";

export type ScopesPolicyPluginOptions = {};

export class ScopesPolicyPlugin extends PolicyPlugin<string[], any> {
  public static readonly key = "scopes";
  public static readonly autoLoadOptions = false; // plugin is disabled in default
  private opts: ScopesPolicyPluginOptions;

  constructor(protected readonly props: PolicyPluginProps, opts?: RecursivePartial<ScopesPolicyPluginOptions>) {
    super(props);
    this.opts = _.defaultsDeep(opts || {}, {
      // default options
    });
  }

  public validateSchema(schema: Readonly<string[]>): ValidationError[] {
    return validateValue(schema, {
      type: "array",
      items: "string",
      empty: false,
    }, {
      field: "",
    });
  }

  public async start(): Promise<void> {
    throw new Error("not implemented");
  }

  public async stop(): Promise<void> {
    throw new Error("not implemented");
  }

  public describeSchema(schema: Readonly<string[]>): any {
    return {};
  }

  // TODO: [policy] OIDC Scope plugin
  public testCallPolicy(schema: string[], args: Readonly<CallPolicyArgs>): true | any {
    return true;
  }

  public testPublishPolicy(schema: string[], args: Readonly<PublishPolicyArgs>): true | any {
    return true;
  }

  public testSubscribePolicy(schema: string[], args: Readonly<SubscribePolicyArgs>): true | any {
    return true;
  }
}

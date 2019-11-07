import * as _ from "lodash";
import { RecursivePartial, validateValue, ValidationError } from "../../../../interface";
import { CallPolicyArgs, PublishPolicyArgs, SubscribePolicyArgs } from "../../connector";
import { PolicyPlugin, PolicyPluginProps } from "../plugin";
import { ScopePolicyPluginCatalog, ScopePolicyPluginSchema } from "./schema";

export type ScopePolicyPluginOptions = {};

export class ScopePolicyPlugin extends PolicyPlugin<ScopePolicyPluginSchema, ScopePolicyPluginCatalog> {
  public static readonly key = "scope";
  public static readonly autoLoadOptions = false; // plugin is disabled in default
  private opts: ScopePolicyPluginOptions;

  constructor(protected readonly props: PolicyPluginProps, opts?: RecursivePartial<ScopePolicyPluginOptions>) {
    super(props);
    this.opts = _.defaultsDeep(opts || {}, {
      // default options
    });
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
    throw new Error("not implemented");
  }

  public async stop(): Promise<void> {
    throw new Error("not implemented");
  }

  public describeSchema(schema: Readonly<ScopePolicyPluginSchema>): ScopePolicyPluginCatalog {
    return {} as ScopePolicyPluginCatalog;
  }

  // TODO: OIDC Scope plugin
  public testCallPolicy(schema: ScopePolicyPluginSchema, args: Readonly<CallPolicyArgs>): true | any {
    return true;
  }

  public testPublishPolicy(schema: ScopePolicyPluginSchema, args: Readonly<PublishPolicyArgs>): true | any {
    return true;
  }

  public testSubscribePolicy(schema: ScopePolicyPluginSchema, args: Readonly<SubscribePolicyArgs>): true | any {
    return true;
  }
}

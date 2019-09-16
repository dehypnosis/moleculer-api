import * as _ from "lodash";
import { RecursivePartial, validateInlineFunction, ValidationError } from "../../../../interface";
import { CallPolicyArgs, PublishPolicyArgs, SubscribePolicyArgs } from "../../connector/schema";
import { PolicyPlugin, PolicyPluginProps } from "../plugin";

export type FilterPolicyPluginOptions = {};

// tslint:disable-next-line:ban-types
type StringType = String;

export class FilterPolicyPlugin extends PolicyPlugin<StringType, any> {
  public static readonly key = "filter";
  public static readonly autoLoadOptions: FilterPolicyPluginOptions = {};
  private readonly opts: FilterPolicyPluginOptions;

  constructor(protected readonly props: PolicyPluginProps, opts?: RecursivePartial<FilterPolicyPluginOptions>) {
    super(props);
    this.opts = _.defaultsDeep(opts || {}, FilterPolicyPlugin.autoLoadOptions);
  }

  // tslint:disable-next-line:ban-types
  public validateSchema(schema: Readonly<StringType>): ValidationError[] {
    const errors: ValidationError[] = [];
    if (!validateInlineFunction(schema as string)) {
      errors.push({
        type: "invalidFunctionString",
        field: "",
        expected: "JavaScriptFunctionString",
        actual: schema,
        message: "FilterPolicyPluginSchema should be a string which denotes a JavaScript function",
      });
    }
    return errors;
  }

  public async start(): Promise<void> {
  }

  public async stop(): Promise<void> {
  }

  // tslint:disable-next-line:ban-types
  public describeSchema(schema: Readonly<StringType>): any {
    return {};
  }

  // TODO: [policy] filter policy plugin
  public testCallPolicy(schema: Readonly<StringType>, args: Readonly<CallPolicyArgs>): boolean | any {
    return true;
  }

  public testPublishPolicy(schema: Readonly<StringType>, args: Readonly<PublishPolicyArgs>): boolean | any {
    return true;
  }

  public testSubscribePolicy(schema: Readonly<StringType>, args: Readonly<SubscribePolicyArgs>) {
    return true;
  }
}

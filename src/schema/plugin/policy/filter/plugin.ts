import * as _ from "lodash";
import { RecursivePartial, validateInlineFunction, ValidationError } from "../../../../interface";
import { ServiceAPIIntegration } from "../../../integration";
import { CallPolicyTester, PolicyPlugin, PolicyPluginProps, PublishPolicyTester, SubscribePolicyTester } from "../plugin";
import { FilterPolicyPluginSchema, FilterPolicyPluginCatalog } from "./schema";

export type FilterPolicyPluginOptions = {};

export class FilterPolicyPlugin extends PolicyPlugin<FilterPolicyPluginSchema, FilterPolicyPluginCatalog> {
  public static readonly key = "filter";
  public static readonly autoLoadOptions: FilterPolicyPluginOptions = {};
  private readonly opts: FilterPolicyPluginOptions;

  constructor(protected readonly props: PolicyPluginProps, opts?: RecursivePartial<FilterPolicyPluginOptions>) {
    super(props);
    this.opts = _.defaultsDeep(opts || {}, FilterPolicyPlugin.autoLoadOptions);
  }

  public validateSchema(schema: Readonly<FilterPolicyPluginSchema>): ValidationError[] {
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
  public describeSchema(schema: Readonly<FilterPolicyPluginSchema>): FilterPolicyPluginCatalog {
    return {} as FilterPolicyPluginCatalog;
  }

  public compileCallPolicySchema(schema: Readonly<FilterPolicyPluginSchema>, integration: Readonly<ServiceAPIIntegration>): CallPolicyTester {
    return (args) => {
      return true;
    };
  }

  public compilePublishPolicySchema(schema: Readonly<FilterPolicyPluginSchema>, integration: Readonly<ServiceAPIIntegration>): PublishPolicyTester {
    return (args) => {
      return true;
    };
  }

  public compileSubscribePolicySchema(schema: Readonly<FilterPolicyPluginSchema>, integration: Readonly<ServiceAPIIntegration>): SubscribePolicyTester {
    return (args) => {
      return true;
    };
  }
}

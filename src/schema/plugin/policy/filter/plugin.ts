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

  public compileCallPolicySchemata(schemata: ReadonlyArray<FilterPolicyPluginSchema>, descriptions: ReadonlyArray<string|null>, integration: Readonly<ServiceAPIIntegration>): CallPolicyTester {
    return this.compilePolicySchemata(schemata, descriptions, integration) as CallPolicyTester;
  }

  public compilePublishPolicySchemata(schemata: ReadonlyArray<FilterPolicyPluginSchema>, descriptions: ReadonlyArray<string|null>, integration: Readonly<ServiceAPIIntegration>): PublishPolicyTester {
    return this.compilePolicySchemata(schemata, descriptions, integration) as PublishPolicyTester;
  }

  public compileSubscribePolicySchemata(schemata: ReadonlyArray<FilterPolicyPluginSchema>, descriptions: ReadonlyArray<string|null>, integration: Readonly<ServiceAPIIntegration>): SubscribePolicyTester {
    return this.compilePolicySchemata(schemata, descriptions, integration) as SubscribePolicyTester;
  }

  private compilePolicySchemata(schemata: ReadonlyArray<FilterPolicyPluginSchema>, descriptions: ReadonlyArray<string|null>, integration: Readonly<ServiceAPIIntegration>): CallPolicyTester | PublishPolicyTester | SubscribePolicyTester {
    const fnStrings = Array.from(new Set<string>(schemata));
    const descriptionsMap = new Map<(...args: any) => boolean, string[]>();
    const testers = fnStrings.map(fnString => {
      const fn = integration.service.broker!.createInlineFunction<{ context: any; params: any; [key: string]: any }, boolean>({
        function: fnString,
        mappableKeys: ["context", "params"],
        reporter: integration.reporter as any,
        returnTypeCheck: v => typeof v === "boolean",
        returnTypeNotation: "boolean",
      });

      if(!descriptionsMap.has(fn)) {
        descriptionsMap.set(fn, []);
      }
      const desc = descriptions[schemata.indexOf(fnString)];
      if (desc) {
        const matchedDescriptions = descriptionsMap.get(fn)!;
        matchedDescriptions.push(desc);
      }

      return fn;
    });

    return (args: Readonly<{ context: any; params: any; }>) => {
      for (const tester of testers) {
        if (!tester(args)) {
          // TODO: normalize error
          const error: any = new Error("permission denied");
          error.statusCode = 401;
          error.description = descriptionsMap.get(tester);
          throw error;
        }
      }
      return true;
    };
  }
}

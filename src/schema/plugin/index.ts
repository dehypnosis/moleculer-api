import { defaultPolicyPluginConstructorOptions, PolicyPluginConstructorOptions, PolicyPluginConstructors } from "./policy";
import { defaultProtocolPluginConstructorOptions, ProtocolPluginConstructorOptions, ProtocolPluginConstructors } from "./protocol";

export * from "./protocol";
export * from "./policy";

/* plugins */
export const SchemaPluginConstructors: {
  protocol: typeof ProtocolPluginConstructors,
  policy: typeof PolicyPluginConstructors,
} = {
  protocol: ProtocolPluginConstructors,
  policy: PolicyPluginConstructors,
};

export type SchemaPluginConstructorOptions = {
  protocol: ProtocolPluginConstructorOptions,
  policy: PolicyPluginConstructorOptions,
};

export const defaultSchemaPluginConstructorOptions: SchemaPluginConstructorOptions = {
  protocol: defaultProtocolPluginConstructorOptions,
  policy: defaultPolicyPluginConstructorOptions,
};

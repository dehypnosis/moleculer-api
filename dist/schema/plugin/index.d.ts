import { PolicyPluginConstructorOptions, PolicyPluginConstructors } from "./policy";
import { ProtocolPluginConstructorOptions, ProtocolPluginConstructors } from "./protocol";
export * from "./protocol";
export * from "./policy";
export declare const SchemaPluginConstructors: {
    protocol: typeof ProtocolPluginConstructors;
    policy: typeof PolicyPluginConstructors;
};
export declare type SchemaPluginConstructorOptions = {
    protocol: ProtocolPluginConstructorOptions;
    policy: PolicyPluginConstructorOptions;
};
export declare const defaultSchemaPluginConstructorOptions: SchemaPluginConstructorOptions;

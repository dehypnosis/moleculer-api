import { PolicyPlugin } from "..";
import { ServiceAPIIntegration } from "../../integration";
import { CallConnectorSchema, CallConnector, MapConnector, PublishConnector, PublishConnectorSchema, SubscribeConnector, SubscribeConnectorSchema } from "./schema";
export declare const ConnectorCompiler: {
    map<MappableArgs>(schema: string, integration: Readonly<ServiceAPIIntegration>, opts: {
        mappableKeys: Extract<keyof MappableArgs, string>[];
    }): MapConnector<MappableArgs>;
    call<MappableArgs_1 extends {
        [key: string]: any;
    }>(schema: Readonly<CallConnectorSchema<any>>, integration: Readonly<ServiceAPIIntegration>, policyPlugins: readonly Readonly<PolicyPlugin<any, any>>[], opts: {
        explicitMappableKeys: Extract<keyof MappableArgs_1, string>[];
        implicitMappableKeys: Extract<keyof MappableArgs_1, string>[];
        batchingEnabled: boolean;
        disableCache: boolean;
    }): CallConnector<MappableArgs_1>;
    publish<MappableArgs_2>(schema: Readonly<PublishConnectorSchema<any>>, integration: Readonly<ServiceAPIIntegration>, policyPlugins: readonly Readonly<PolicyPlugin<any, any>>[], opts: {
        mappableKeys: Extract<keyof MappableArgs_2, string>[];
    }): PublishConnector<MappableArgs_2>;
    subscribe<MappableArgs_3, GetAsyncIterator extends boolean | undefined>(schema: Readonly<SubscribeConnectorSchema<any>>, integration: Readonly<ServiceAPIIntegration>, policyPlugins: readonly Readonly<PolicyPlugin<any, any>>[], opts: {
        mappableKeys: Extract<keyof MappableArgs_3, string>[];
        getAsyncIterator?: GetAsyncIterator | undefined;
    }): SubscribeConnector<MappableArgs_3, GetAsyncIterator extends true ? null : (packet: any) => void>;
};

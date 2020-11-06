import { ParamsMappingInfo, ServiceStatus, EventPacket, EventListener } from "../../../broker";
import { PolicyCatalog } from "../policy";
export declare type CallConnector<MappableArgs extends {
    [key: string]: any;
} = any> = (context: any, mappableArgs: MappableArgs, injectedParams?: {
    [key: string]: any;
}) => Promise<any>;
export declare type PublishConnector<MappableArgs extends {
    [key: string]: any;
} = any> = (context: any, mappableArgs: MappableArgs) => Promise<any>;
export declare type SubscribeConnector<MappableArgs extends {
    [key: string]: any;
} = any, Listener extends EventListener | null = EventListener> = (context: any, mappableArgs: MappableArgs, listener: Listener) => Promise<Listener extends null ? AsyncIterator<any> : void>;
export declare type SubscribeConnectorForAsyncIterator<MappableArgs extends {
    [key: string]: any;
} = any> = (context: any, mappableArgs: MappableArgs) => AsyncIterator<EventPacket>;
export declare type MapConnector<MappableArgs extends {
    [key: string]: any;
} = any> = (mappableArgs: MappableArgs) => any;
export declare type Connector = CallConnector | PublishConnector | SubscribeConnector | SubscribeConnectorForAsyncIterator | MapConnector;
export declare type ParamsConnectorSchema<MappableArgs extends {
    [key: string]: any;
} = any> = {
    [key: string]: any;
} | string;
export declare type MapConnectorSchema<Fn extends (mappableArgs: any) => any = (mappableArgs: {
    [key: string]: any;
}) => any> = string;
export declare type CallConnectorResponseMappableArgs<MappableArgs extends {
    [key: string]: any;
} = {
    [key: string]: any;
}> = {
    request: MappableArgs & {
        context: any;
        params: any;
    };
    response: any;
};
export declare type CallConnectorSchema<MappableArgs extends {
    [key: string]: any;
} = any> = {
    action: string;
    params: ParamsConnectorSchema<MappableArgs>;
    implicitParams?: boolean;
    if?: MapConnectorSchema<(args: MappableArgs) => boolean>;
    map?: MapConnectorSchema<(args: CallConnectorResponseMappableArgs<MappableArgs>) => any>;
};
export declare type PublishConnectorResponseMappableArgs = {
    context: any;
} & Omit<EventPacket, "from">;
export declare type PublishConnectorSchema<MappableArgs extends {
    [key: string]: any;
} = any> = {
    event: string | MapConnectorSchema<(args: MappableArgs) => string>;
    params: ParamsConnectorSchema<MappableArgs>;
    groups?: string[];
    broadcast?: boolean;
    map?: MapConnectorSchema<(args: PublishConnectorResponseMappableArgs) => any>;
    filter?: MapConnectorSchema<(args: SubscribeConnectorResponseMappableArgs) => any>;
};
export declare type SubscribeConnectorResponseMappableArgs = {
    context: any;
} & EventPacket;
export declare type SubscribeConnectorSchema<MappableArgs extends {
    [key: string]: any;
} = any> = {
    events: string[] | MapConnectorSchema<(args: MappableArgs) => string[]>;
    filter?: MapConnectorSchema<(args: SubscribeConnectorResponseMappableArgs) => any>;
    map?: MapConnectorSchema<(args: SubscribeConnectorResponseMappableArgs) => any>;
};
export declare type ConnectorSchema = CallConnectorSchema | PublishConnectorSchema | SubscribeConnectorSchema | MapConnectorSchema;
export declare type ConnectorSchemaType = "call" | "publish" | "subscribe" | "map";
export declare type CallConnectorCatalog = {
    type: "call";
    map: string | null;
    status: () => ServiceStatus;
    policies: PolicyCatalog[];
    action: string;
    params: ParamsMappingInfo;
};
export declare type PublishConnectorCatalog = {
    type: "publish";
    map: string | null;
    status: () => ServiceStatus;
    policies: PolicyCatalog[];
    event: string | MapConnectorSchema<(args: {
        [key: string]: any;
    }) => string>;
    params: ParamsMappingInfo;
    groups: string[];
    broadcast: boolean;
};
export declare type SubscribeConnectorCatalog = {
    type: "subscribe";
    map: string | null;
    status: () => ServiceStatus;
    policies: PolicyCatalog[];
    events: string[] | MapConnectorSchema<(args: {
        [key: string]: any;
    }) => string[]>;
};
export declare type MapConnectorCatalog = {
    type: "map";
    map: string;
};
export declare type ConnectorCatalog = CallConnectorCatalog | PublishConnectorCatalog | SubscribeConnectorCatalog | MapConnectorCatalog;
export declare type CallPolicyArgs<MappableArgs extends {
    [key: string]: any;
} = {
    [key: string]: any;
}> = CallConnectorResponseMappableArgs<MappableArgs>["request"];
export declare type CallPolicySchema = {
    description: string;
    actions: string[];
    [pluginKey: string]: any;
};
export declare type PublishPolicyArgs = PublishConnectorResponseMappableArgs;
export declare type PublishPolicySchema = {
    description: string;
    events: string[];
    [pluginKey: string]: any;
};
export declare type SubscribePolicyArgs = {
    context: any;
    event: string;
};
export declare type SubscribePolicySchema = {
    description: string;
    events: string[];
    [pluginKey: string]: any;
};

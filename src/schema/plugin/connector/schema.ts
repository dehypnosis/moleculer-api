import { ParamsMappingInfo, ServiceStatus, EventPacket, EventListener } from "../../../broker";
import { PolicyCatalog } from "../policy";

/* Connectors */
// injected params usage eg.: inject client websocket stream to broker delegator
export type CallConnector<MappableArgs extends { [key: string]: any } = any> = (context: any, mappableArgs: MappableArgs, injectedParams?: {[key: string]: any}) => Promise<any>;
export type PublishConnector<MappableArgs extends { [key: string]: any } = any> = (context: any, mappableArgs: MappableArgs) => Promise<any>;
export type SubscribeConnector<MappableArgs extends { [key: string]: any } = any, Listener extends EventListener | null = EventListener> = (
  context: any,
  mappableArgs: MappableArgs,
  listener: Listener,
) => Promise<Listener extends null ? AsyncIterator<any> : void>;
export type SubscribeConnectorForAsyncIterator<MappableArgs extends { [key: string]: any } = any> = (context: any, mappableArgs: MappableArgs) => AsyncIterator<EventPacket>;
export type MapConnector<MappableArgs extends { [key: string]: any } = any> = (mappableArgs: MappableArgs) => any;
export type Connector = CallConnector | PublishConnector | SubscribeConnector | SubscribeConnectorForAsyncIterator | MapConnector;

/* Connectors Schema */
export type ParamsConnectorSchema<MappableArgs extends { [key: string]: any } = any> = {
  [key: string]: any;
} | string;

export type MapConnectorSchema<Fn extends (mappableArgs: any) => any = (mappableArgs: { [key: string]: any }) => any> = string;

/*
  map connector scheme is actually just a string which denotes a javascript function
  "args" of map connectors are fully up to protocol
  eg. REST protocol
  {
    ...,
    map: (({ context, path, query, body }) => {
      return context.user.id;
    }).toString(),
  }
  eg. GraphQL protocol
  {
     ...,
     fooFieldNumber: ({ context, source, args, info }) => {
       return parseInt(source.foodField);
     }).toString()
  }
 */

export type CallConnectorResponseMappableArgs<MappableArgs extends { [key: string]: any } = { [key: string]: any }> = { request: MappableArgs & { context: any; params: any }, response: any };
export type CallConnectorSchema<MappableArgs extends { [key: string]: any } = any> = {
  // action name
  action: string;

  // call params mapper
  params: ParamsConnectorSchema<MappableArgs>;

  // to disable implicit params mapping set false
  implicitParams?: boolean;

  // call invocation filter but it return null when failed rather throw 401 error as like policies do
  if?: MapConnectorSchema<(args: MappableArgs) => boolean>;

  // response mapper
  map?: MapConnectorSchema<(args: CallConnectorResponseMappableArgs<MappableArgs>) => any>; // default behavior: ({ context, action, params, response }) => response
};

export type PublishConnectorResponseMappableArgs = { context: any } & Omit<EventPacket, "from">;
export type PublishConnectorSchema<MappableArgs extends { [key: string]: any } = any> = {
  // event name can be derived from inline function
  event: string | MapConnectorSchema<(args: MappableArgs) => string>; // string or ({ ... }) => string

  // event params mapper
  params: ParamsConnectorSchema<MappableArgs>;

  // delivery queue groups, empty means to all groups
  groups?: string[];

  // delivery events to all members of given groups? or just a single member of given groups?
  broadcast?: boolean;

  // response mapper
  map?: MapConnectorSchema<(args: PublishConnectorResponseMappableArgs) => any>; // default behavior: ({ context, event, params, groups, broadcast }) => params

  // filter received event once more by inline function
  filter?: MapConnectorSchema<(args: SubscribeConnectorResponseMappableArgs) => any>; // default behavior: () => true
};

export type SubscribeConnectorResponseMappableArgs = { context: any } & EventPacket;
export type SubscribeConnectorSchema<MappableArgs extends { [key: string]: any } = any> = {
  // event names can be derived from inline function
  events: string[] | MapConnectorSchema<(args: MappableArgs) => string[]>; // string[] or ({ ... }) => string[]

  // filter received event once more by inline function
  filter?: MapConnectorSchema<(args: SubscribeConnectorResponseMappableArgs) => any>; // default behavior: () => true

  // response mapper
  map?: MapConnectorSchema<(args: SubscribeConnectorResponseMappableArgs) => any>; // default behavior: ({ context, event params, groups, broadcast, from  }) => params
};

export type ConnectorSchema = CallConnectorSchema | PublishConnectorSchema | SubscribeConnectorSchema | MapConnectorSchema;
export type ConnectorSchemaType = "call" | "publish" | "subscribe" | "map";

/* Connectors Catalog */
export type CallConnectorCatalog = {
  type: "call";
  map: string | null;
  status: () => ServiceStatus;
  policies: PolicyCatalog[];
  action: string;
  params: ParamsMappingInfo;
};

export type PublishConnectorCatalog = {
  type: "publish";
  map: string | null;
  status: () => ServiceStatus;
  policies: PolicyCatalog[];
  event: string | MapConnectorSchema<(args: { [key: string]: any }) => string>;
  params: ParamsMappingInfo;
  groups: string[];
  broadcast: boolean;
};

export type SubscribeConnectorCatalog = {
  type: "subscribe";
  map: string | null;
  status: () => ServiceStatus;
  policies: PolicyCatalog[];
  events: string[] | MapConnectorSchema<(args: { [key: string]: any }) => string[]>;
};

export type MapConnectorCatalog = {
  type: "map";
  map: string;
};

export type ConnectorCatalog = CallConnectorCatalog | PublishConnectorCatalog | SubscribeConnectorCatalog | MapConnectorCatalog;

/* Policy */
export type CallPolicyArgs<MappableArgs extends { [key: string]: any } = { [key: string]: any }> = CallConnectorResponseMappableArgs<MappableArgs>["request"];
export type CallPolicySchema = {
  description: string;
  actions: string[];
  [pluginKey: string]: any;
};

export type PublishPolicyArgs = PublishConnectorResponseMappableArgs;
export type PublishPolicySchema = {
  description: string;
  events: string[];
  [pluginKey: string]: any;
};

export type SubscribePolicyArgs = { context: any, event: string };
export type SubscribePolicySchema = {
  description: string;
  events: string[];
  [pluginKey: string]: any;
};

import * as kleur from "kleur";
import { PolicyPlugin } from "..";
import { EventPacket, ServiceAction } from "../../../broker";
import { ParamsMapper } from "../../../broker/params";
import { ServiceAPIIntegration } from "../../integration";
import { composeAsyncIterators, AsyncIteratorComposeItem } from "../../../interface";
import { PolicyCompiler } from "./policy";
import {
  CallConnectorSchema, CallConnector, CallConnectorResponseMappableArgs, CallPolicyArgs,
  MapConnector,
  MapConnectorSchema,
  PublishConnector,
  PublishConnectorResponseMappableArgs,
  PublishConnectorSchema,
  SubscribeConnector, SubscribeConnectorResponseMappableArgs,
  SubscribeConnectorSchema, SubscribePolicyArgs, PublishPolicyArgs,
} from "./schema";

/* use below functions to implement ProtocolPlugin.compileSchema methods */
export const ConnectorCompiler = {
  map<MappableArgs>(
    schema: Readonly<MapConnectorSchema>,
    integration: Readonly<ServiceAPIIntegration>,
    opts: {
      mappableKeys: Extract<keyof MappableArgs, string>[];
    },
  ): MapConnector<MappableArgs> {
    // find path of connector schema from whole service schema
    const field = getPathOfPartialSchema(schema, integration.schema);

    const connector: MapConnector<MappableArgs> = integration.service.broker!.createInlineFunction<MappableArgs, any>({
      function: schema,
      mappableKeys: opts.mappableKeys,
      reporter: integration.reporter.getChild({
        field: kleur.bold(kleur.cyan(field)),
        schema,
      }),
    });

    return withLabel(connector, `mapConnector`);
  },

  call<MappableArgs extends { [key: string]: any }>(
    schema: Readonly<CallConnectorSchema>,
    integration: Readonly<ServiceAPIIntegration>,
    policyPlugins: ReadonlyArray<Readonly<PolicyPlugin<any, any>>>,
    opts: {
      explicitMappableKeys: Extract<keyof MappableArgs, string>[];
      implicitMappableKeys: Extract<keyof MappableArgs, string>[];
      batchingEnabled: boolean;
      disableCache: boolean;
    },
  ): CallConnector<MappableArgs> {
    const broker = integration.service.broker!;

    // find path of connector schema from whole service schema
    const field = getPathOfPartialSchema(schema, integration.schema);

    // find action
    let action: Readonly<ServiceAction>;
    const actionId = schema.action;

    // to map call params
    let paramsMapper: ParamsMapper<MappableArgs>;

    // to filter request
    const ifMapper = schema.if ? broker.createInlineFunction<MappableArgs, boolean>({
      function: schema.if,
      mappableKeys: opts.explicitMappableKeys,
      reporter: integration.reporter.getChild({
        field: kleur.bold(kleur.cyan(field + ".if")),
        schema: schema.if,
      }),
    }) : null;

    // to map response
    const responseMapper = schema.map ? broker.createInlineFunction<CallConnectorResponseMappableArgs, any>({
      function: schema.map,
      mappableKeys: ["request", "response"],
      reporter: integration.reporter.getChild({
        field: kleur.bold(kleur.cyan(field + ".map")),
        schema: schema.map,
      }),
    }) : null;

    // to apply access control policy plugin
    const policySchemata = integration.schema.policy && Array.isArray(integration.schema.policy.call)
      ? integration.schema.policy.call.filter(policy => policy.actions.some(actionNamePattern => broker.matchActionName(actionId, actionNamePattern)))
      : [];

    // to test permission
    const policyTester = policySchemata.length ? PolicyCompiler.call(policySchemata, policyPlugins,  integration, {}) : null;

    const connector: CallConnector<MappableArgs> = async (context, mappableArgs, injectedParams): Promise<any> => {
      // dynamically load action before first call
      if (!action) {
        action = integration.findAction(actionId)!;

        if (!action) {
          throw new Error(`action not found: ${actionId}`); // TODO: normalize error
        }

        // also create paramsMapper dynamically
        paramsMapper = broker.createParamsMapper<MappableArgs>({
          explicitMappableKeys: opts.explicitMappableKeys,
          explicitMapping: schema.params,
          implicitMappableKeys: schema.implicitParams === false ? null : opts.implicitMappableKeys,
          batchingEnabled: opts.batchingEnabled,
          paramsSchema: action.paramsSchema,
          reporter: integration.reporter.getChild({
            field: kleur.bold(kleur.cyan(field + ".params")),
            schema: schema.params,
          }),
        });
      }

      // test if
      if (ifMapper && ifMapper(mappableArgs) !== true) {
        return null;
      }

      // map params
      const {params, batchingParams} = paramsMapper.map(mappableArgs);

      // test policy
      const request: CallPolicyArgs<MappableArgs> = {...mappableArgs, params: {...params, ...batchingParams} };
      if (policyTester && !policyTester(request)) {
        throw new Error("forbidden call"); // TODO: normalize error
      }

      // call
      const response = await broker.call(context, {
        action,
        params: injectedParams ? Object.assign(params, injectedParams) : params,
        batchingParams,
        disableCache: opts.disableCache,
      });

      // map response
      return responseMapper ? responseMapper({request, response}) : response;
    };

    return withLabel(connector, `callConnector`);
  },

  publish<MappableArgs>(
    schema: Readonly<PublishConnectorSchema>,
    integration: Readonly<ServiceAPIIntegration>,
    policyPlugins: ReadonlyArray<Readonly<PolicyPlugin<any, any>>>,
    opts: {
      mappableKeys: Extract<keyof MappableArgs, string>[];
    },
  ): PublishConnector<MappableArgs> {
    const broker = integration.service.broker!;

    // find path of connector schema from whole service schema
    const field = getPathOfPartialSchema(schema, integration.schema);

    // to map event params
    const paramsMapper = broker.createParamsMapper<MappableArgs>({
      explicitMappableKeys: opts.mappableKeys,
      explicitMapping: schema.params,
      implicitMappableKeys: [], // implicit mapping for publish is not supported (there are no event params schema.. things yet)
      batchingEnabled: false,
      paramsSchema: null,
      reporter: integration.reporter.getChild({
        field: kleur.bold(kleur.cyan(field + ".params")),
        schema: schema.params,
      }),
    });

    // to filter packet
    const packetFilter = schema.filter ? broker.createInlineFunction<PublishConnectorResponseMappableArgs, boolean>({
      function: schema.filter,
      mappableKeys: ["context", "event", "broadcast", "params"],
      reporter: integration.reporter.getChild({
        field: kleur.bold(kleur.cyan(field + ".filter")),
        schema: schema.filter,
      }),
      // returnTypeCheck: value => typeof value === "boolean",
      // returnTypeNotation: "boolean",
    }) : null;

    // to map response
    const responseMapper = schema.map ? broker.createInlineFunction<PublishConnectorResponseMappableArgs, any>({
      function: schema.map,
      mappableKeys: ["context", "event", "params", "groups", "broadcast"],
      reporter: integration.reporter.getChild({
        field: kleur.bold(kleur.cyan(field + ".map")),
        schema: schema.map,
      }),
    }) : null;

    // schema.event can be a constant (string) or inline function which should generate event names (string[])
    let eventNameOrFn: string | ((args: MappableArgs) => string);
    try {
      eventNameOrFn = broker.createInlineFunction<MappableArgs, string>({
        function: schema.event,
        mappableKeys: opts.mappableKeys,
        reporter: integration.reporter.getChild({
          field: kleur.bold(kleur.cyan(field + ".event")),
          schema: schema.event,
        }),
        returnTypeCheck: value => typeof value === "string" && !!value,
        returnTypeNotation: "string",
      });
    } catch (error) {
      eventNameOrFn = schema.event;
    }

    // for static event name
    if (typeof eventNameOrFn === "string") {
      const eventName = eventNameOrFn;
      const policySchemata = integration.schema.policy && Array.isArray(integration.schema.policy.publish)
        ? integration.schema.policy.publish.filter(policy => policy.events.some(eventNamePattern => broker.matchEventName(eventName, eventNamePattern)))
        : [];
      const policyTester = policySchemata.length ? PolicyCompiler.publish(policySchemata, policyPlugins,  integration, {}) : null;

      const baseArgs = {event: eventName, groups: schema.groups || [], broadcast: schema.broadcast === true};

      const connector: PublishConnector = async (context, mappableArgs) => {
        // map params
        const {params} = paramsMapper.map(mappableArgs); // batching disabled

        // test policy
        const args: PublishPolicyArgs = {...baseArgs, context, params};
        if (policyTester && !policyTester(args)) {
          throw new Error("forbidden publish"); // TODO: normalize error
        }

        // publish
        if (!packetFilter || packetFilter(args)) {
          await broker.publishEvent(context, args);
        }

        return responseMapper ? responseMapper(args) : args.params; // just return params only if mapper has not been defined
      };

      return withLabel(connector, `publishConnector`);
    } else {
      // for dynamic event name
      const getEventName = eventNameOrFn;
      const policySchemata = integration.schema.policy && Array.isArray(integration.schema.policy.publish)
        ? integration.schema.policy.publish
        : [];
      const baseArgs = {groups: schema.groups || [], broadcast: schema.broadcast === true};

      const connector: PublishConnector = async (context, mappableArgs) => {
        // map params
        const {params} = paramsMapper.map(mappableArgs); // batching disabled

        // get event name
        const eventName = getEventName(mappableArgs);

        // test policy
        const args = {...baseArgs, context, event: eventName, params};
        const filteredPolicySchemata = policySchemata.filter(policy => policy.events.some(eventNamePattern => broker.matchEventName(eventName, eventNamePattern)));
        const policyTester = filteredPolicySchemata.length ? PolicyCompiler.publish(filteredPolicySchemata, policyPlugins,  integration, {}) : null;
        if (policyTester && !policyTester(args)) {
          throw new Error("forbidden publish"); // TODO: normalize error
        }

        // publish
        await broker.publishEvent(context, args);

        // map response
        return responseMapper ? responseMapper(args) : args.params; // just return params only if mapper has not been defined
      };

      return withLabel(connector, `publishConnector`);
    }
  },

  subscribe<MappableArgs, GetAsyncIterator extends boolean | undefined>(
    schema: Readonly<SubscribeConnectorSchema>,
    integration: Readonly<ServiceAPIIntegration>,
    policyPlugins: ReadonlyArray<Readonly<PolicyPlugin<any, any>>>,
    opts: {
      mappableKeys: Extract<keyof MappableArgs, string>[];
      getAsyncIterator?: GetAsyncIterator,
    },
  ): SubscribeConnector<MappableArgs, GetAsyncIterator extends true ? null : (packet: any) => void> {
    const broker = integration.service.broker!;

    // find path of connector schema from whole service schema
    const field = getPathOfPartialSchema(schema, integration.schema);

    // to filter response
    const responseFilter = schema.filter ? broker.createInlineFunction<SubscribeConnectorResponseMappableArgs, boolean>({
      function: schema.filter,
      mappableKeys: ["context", "event", "broadcast", "params"],
      reporter: integration.reporter.getChild({
        field: kleur.bold(kleur.cyan(field + ".filter")),
        schema: schema.filter,
      }),
      // returnTypeCheck: value => typeof value === "boolean",
      // returnTypeNotation: "boolean",
    }) : null;

    // to map response
    const responseMapper = schema.map ? broker.createInlineFunction<SubscribeConnectorResponseMappableArgs, any>({
      function: schema.map,
      mappableKeys: ["context", "event", "broadcast", "params"],
      reporter: integration.reporter.getChild({
        field: kleur.bold(kleur.cyan(field + ".map")),
        schema: schema.map,
      }),
    }) : null;

    // schema.event can be a constant (string) or inline function which should generate event names (string[])
    let eventNamesOrFn: string[] | ((args: MappableArgs) => string[]);
    if (typeof schema.events === "string") {
      eventNamesOrFn = broker.createInlineFunction<MappableArgs, string[]>({
        function: schema.events,
        mappableKeys: opts.mappableKeys,
        reporter: integration.reporter.getChild({
          field: kleur.bold(kleur.cyan(field + ".events")),
          schema: schema.events,
        }),
        returnTypeCheck: value => Array.isArray(value) && value.every(name => typeof name === "string" && name),
        returnTypeNotation: "string[]",
      });
    } else {
      eventNamesOrFn = schema.events;
    }

    const policySchemata = integration.schema.policy && Array.isArray(integration.schema.policy.subscribe) ? integration.schema.policy.subscribe : [];

    const connector: SubscribeConnector<MappableArgs, GetAsyncIterator extends true ? null : (packet: any) => void> = async (context, mappableArgs, listener) => {
      const eventNames = Array.isArray(eventNamesOrFn) ? eventNamesOrFn : eventNamesOrFn(mappableArgs);
      const asyncIteratorComposeItems: AsyncIteratorComposeItem<EventPacket>[] = [];

      for (const event of eventNames) {

        // test policy
        const filteredPolicySchemata = policySchemata.filter(policy => policy.events.some(eventNamePattern => broker.matchEventName(event, eventNamePattern)));
        const policyTester = filteredPolicySchemata.length ? PolicyCompiler.subscribe(filteredPolicySchemata, policyPlugins,  integration, {}) : null;
        const args: SubscribePolicyArgs = {context, event};

        if (policyTester && !policyTester(args)) {
          throw new Error("forbidden subscribe"); // TODO: normalize error
        }

        if (opts.getAsyncIterator) {
          // create async iterator
          asyncIteratorComposeItems.push({
            iterator: await broker.subscribeEvent(context, event, null),
            filter: responseFilter ? (packet => responseFilter({context, ...packet})) : undefined,
            map: responseMapper ? (packet => responseMapper({context, ...packet})) : (packet => packet.params),
          });

        } else {
          // or, just subscribe with packet listener
          const handler = (packet: EventPacket) => {
            const responseArgs = {context, ...packet};

            // filter response
            if (responseFilter && !responseFilter(responseArgs)) {
              return;
            }

            // map response and call listener
            listener!(responseMapper ? responseMapper(responseArgs) : responseArgs.params); // just return params only if mapper has not been defined
          };

          await broker.subscribeEvent(context, event, handler);
        }
      }

      // compose async iterators as one async iterator
      if (opts.getAsyncIterator) {
        return composeAsyncIterators(asyncIteratorComposeItems);
      }

      return undefined as any;
    };

    return withLabel(connector, `subscribeConnector`);
  },
};

function withLabel<T = any>(connector: T, label: string): T {
  Object.defineProperty(connector, "name", {value: `${label}`});
  return connector;
}

function getPathOfPartialSchema(partialSchema: any, schema: object): string {
  const path = recGetPathOfPartialSchema(partialSchema, schema, []);
  if (path) {
    return path;
  }

  // alternatively return location
  const lines = JSON.stringify(schema, null, 2).split(JSON.stringify(partialSchema, null, 2))[0].split("\n");
  const line = lines.length;
  const col = lines[lines.length - 1].length;
  return `${line}:${col}`;
}

function recGetPathOfPartialSchema(partialSchema: any, schema: object, keys: string[]): string | null {
  for (const [k, v] of Object.entries(schema)) {
    if (v === partialSchema) {
      return keys.concat(k).join(".");
    }
    if (typeof v === "object" && v !== null) {
      const path = recGetPathOfPartialSchema(partialSchema, v, keys.concat(k));
      if (path) {
        return path;
      }
    }
  }
  return null;
}

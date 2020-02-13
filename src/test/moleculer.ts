import * as _ from "lodash";
import * as Moleculer from "moleculer";
import { createMoleculerLoggerOptions } from "../broker/delegator/moleculer/logger";
import { RecursivePartial } from "../interface";
import { ServiceAPISchema, ServiceMetaDataSchema } from "../schema";
import { getLogger } from "./util";

export function getMoleculerServiceBroker(props?: {
  logger?: { label?: string, level?: "info" | "warn" | "debug" | "error" };
  services?: (Moleculer.ServiceSchema & { metadata?: ServiceMetaDataSchema })[];
  moleculer?: Moleculer.BrokerOptions
}) {
  const broker = new Moleculer.ServiceBroker(_.defaultsDeep({
    transporter: "TCP",
    logger: createMoleculerLoggerOptions(getLogger(props && props.logger)),
  }, props && props.moleculer || {}));
  if (props && props.services && Array.isArray(props.services)) {
    for (const service of props.services) {
      broker.createService(service);
    }
  }
  return broker;
}

export const MoleculerServiceSchemaFactory: { [key: string]: (branch: string | null, name: string, schemaAdjust?: RecursivePartial<ServiceAPISchema>) => Moleculer.ServiceSchema & { metadata?: ServiceMetaDataSchema } } = {
  echo: (branch: string | null, name: string, schemaAdjust?: RecursivePartial<ServiceAPISchema>) => {
    const schema: Moleculer.ServiceSchema & { metadata?: ServiceMetaDataSchema } = {
      name,
      metadata: {
        api: branch ? _.defaultsDeep(schemaAdjust || {}, {
          branch,
          protocol: {
            GraphQL: {
              description: "my-graphql-types",
              typeDefs: `
              extend type Query {
                name: String
              }
            `,
              resolvers: {
                Query: {
                  name: `() => 'name-string'`,
                },
              },
            },
            REST: {
              basePath: `/${name}`,
              description: "my-rest-endpoints",
              routes: [
                {
                  method: "GET",
                  path: "/echo",
                  call: {
                    action: `/${name}/echo`,
                    params: {},
                  },
                },
              ],
            },
          },
          policy: {},
        }) : undefined,
      },
      actions: {
        echo: {
          params: {
            foo: "string",
          },
          handler(ctx) {
            return (ctx.params! as any).foo || null;
          },
        },
        $report(ctx) {
          ctx.broker.logger.info((ctx.params! as any).table);
        },
      },
    };
    // console.log(require("util").inspect(schema, true, Infinity));
    return schema;
  },
};

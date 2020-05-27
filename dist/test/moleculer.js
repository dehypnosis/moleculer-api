"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MoleculerServiceSchemaFactory = exports.getMoleculerServiceBroker = void 0;
const tslib_1 = require("tslib");
const _ = tslib_1.__importStar(require("lodash"));
const Moleculer = tslib_1.__importStar(require("moleculer"));
const logger_1 = require("../broker/delegator/moleculer/logger");
const util_1 = require("./util");
function getMoleculerServiceBroker(props) {
    const broker = new Moleculer.ServiceBroker(_.defaultsDeep({
        transporter: "TCP",
        logger: logger_1.createMoleculerLoggerOptions(util_1.getLogger(props && props.logger)),
    }, props && props.moleculer || {}));
    if (props && props.services && Array.isArray(props.services)) {
        for (const service of props.services) {
            broker.createService(service);
        }
    }
    return broker;
}
exports.getMoleculerServiceBroker = getMoleculerServiceBroker;
exports.MoleculerServiceSchemaFactory = {
    echo: (branch, name, schemaAdjust) => {
        const schema = {
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
                            resolvers: schemaAdjust && schemaAdjust.protocol && schemaAdjust.protocol.GraphQL && schemaAdjust.protocol.GraphQL.typeDefs ? {} : {
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
                        return ctx.params.foo || null;
                    },
                },
                $report(ctx) {
                    ctx.broker.logger.info(ctx.params.table);
                },
            },
        };
        // console.log(require("util").inspect(schema, true, Infinity));
        return schema;
    },
};
//# sourceMappingURL=moleculer.js.map
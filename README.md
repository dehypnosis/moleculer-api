# API Gateway

A dynamic API Gateway which updates REST endpoints, GraphQL schema, Websocket handlers and access control policies by integrating metadata of discovered remote services.

[![Build Status](https://travis-ci.org/qmit-pro/moleculer-api.svg?branch=master)](https://travis-ci.org/qmit-pro/moleculer-api)
[![Coverage Status](https://coveralls.io/repos/github/qmit-pro/moleculer-api/badge.svg?branch=master)](https://coveralls.io/github/qmit-pro/moleculer-api?branch=master)
[![David](https://img.shields.io/david/qmit-pro/moleculer-api.svg)](https://david-dm.org/qmit-pro/moleculer-api)
[![Known Vulnerabilities](https://snyk.io/test/github/qmit-pro/moleculer-api/badge.svg)](https://snyk.io/test/github/qmit-pro/moleculer-api)
[![NPM version](https://img.shields.io/npm/v/moleculer-api.svg)](https://www.npmjs.com/package/moleculer-api)
[![Moleculer](https://badgen.net/badge/Powered%20by/Moleculer/0e83cd)](https://moleculer.services)

# Release Road-map
- [x] 0.1.x Pre-alpha
    - [x] Service Broker
        - [x] Service Registry which can discover and distinguish equally named but different services
        - [x] Collect action params and response, subscribed events examples
        - [x] Delegate action call with Dataloader batching support
        - [x] Delegate event publishing
        - [x] Delegate event subscription with either handler or async iterator
        - [x] Delegate health check
        - [x] Reporter which reports errors and information to origin services
        - [x] Inline function parser (VM)
        - [x] Explicit/implicit parameters mapping from service action validation schema 
        - [x] Support multiple Service Broker for a single gateway
        - [x] MoleculerJS Delegator
    - [x] Schema Registry
        - [x] Validate service API schema and report
        - [x] Integrations compile and major plugins
            - [x] REST protocol plugin
            - [x] GraphQL protocol plugin with subscription support
        - [x] Retry failed integrations compile
        - [x] Branch and version managements
    - [x] Logger
        - [x] Winston: also can be used with MoleculerJS delegator logger
    - [x] API Server
        - [x] Branch, Version specific routes while reusing handlers
        - [x] HTTP, WebSocket components (express, ws modules)
        - [x] HTTP protocol which mounts HTTP/WS components' modules
- [] 0.2.x Alpha
    - [x] Helmet (disabled by default), CORS (enabled), Serve Static (disabled), Body Parser (enabled), Logging (enabled), Error (enabled) middleware
    - [X] ID (enabled), User Agent (enabled), Cookie Parser (enabled), Locale (enabled), Auth (enabled) context factory
    - [x] Schema Registry plugins
        - [x] WebSocket protocol plugin
    - [x] Streaming support for GraphQL/REST plugin multipart/form-data request
    - [x] Streaming support for WebSocket stream
    - [] Normalized errors
- [] 0.3.x Beta
    - [] I18N (disabled by default) middleware
    - [] Schema Registry plugins
        - [] Filter access control policy plugin
        - [] Scope access control policy plugin
    - [] Gateway schema presets
        - [] Service Catalog and API Catalog in GraphQL
        - [] Health Check endpoints in REST
    - [] Integration example with `moleculer-iam`
- [] 1.0.x First Stable release
    - [] API Server extensions
        - [] HTTPS, HTTP2, HTTP2S extension
    - [] Integration example with `moleculer-i18n`
    - [] Integration example with `moleculer-file`
    - [] Unit tests coverage over 90%
    - [] Memory leak test
    - [] Stress test and performance profiling
    - [] Update documents and translate to English

# Usage
## 1. Documents
- [Features and details: ./docs](./docs)

## 2. Examples
- [MoleculerJs: ./examples](https://github.com/qmit-pro/moleculer-api/tree/master/examples)

## 3. Quick Start
```
npm install moleculer-api --save
```

### A. MoleculerJS
#### APIGatewayService Node
```js
const { ServiceBroker } = require("moleculer");
const { MoleculerAPIGateway } = require("moleculer-api");

const broker = new ServiceBroker();
broker.createService({
  mixins: [ MoleculerAPIGateway ],
  settings: {
    // ...override settings
  },
});

broker.start();
```

#### FooService Node
```js
const { ServiceBroker } = require("moleculer");

const FooService = {
  metadata: {
    api: {
      branch: "master",
      protocol: {
        // REST mapping to service actions
        REST: {
          basePath: "/foo",
          routes: [
            {
              method: "GET",
              path: "/:id",
              deprecated: false,
              description: "Get foo information by id",
              call: {
                action: "foo.get",
                params: {
                  id: "@path.id",
                },
              },
            },
          ]
        },
        
        // GraphQL Schema extension and mapping to service actions, events
        GraphQL: {
          typeDefs: `
            """Dummy type comment"""
            type Foo implements Dummy {
              id: ID!
              name: String!
              email: String!
              """A bar belongs to"""
              bar: Bar
            }
      
            extend type Query {
              viewerFoo: Foo
              bar(id: ID!): Bar
            }
      
            extend type Subscription {
              fooMessage: String!
              barUpdated: Bar
            }
          }`,
          resolvers: {
            Foo: {
              email: `({ source, context, info }) => context.user.isAdmin ? source.email : source.email.split("@")[0]+"@blabla"`,
              bar: {
                call: {
                  action: "bar.get",
                  params: {
                    id: "@source.barId",
                  },
                },
              },
              __isTypeOf: `({ source, context, info }) => source.hasDummyInterface`,
            },
            Query: {
              viewerFoo: {
                call: {
                  action: "foo.get",
                  params: {
                    id: "@context.user.foo.id",
                  },
                },
              },
              bar: {
                call: {
                  action: "bar.get",
                  params: {
                    id: "@args.id",
                  },
                },
              },
            },
            Subscription: {
              // ...see documents for detail     
            },
          },
        },

        // WebSocket mapping to service actions, events
        WebSocket: {
          // ...see documents for detail
        },
      },

      // Common access control policies for all mappings based on OAuth2 scope and FBAC
      policy: {
        call: [
          {
            description: "admin can remove foo, newbie and admin can create foo",
            actions: ["foo.**"],
            scopes: ["foo", "foo.admin"],
            filter: `(action, params, context, utils) => {
              if (action === "foo.remove") {
                return context.user?.isAdmin && context?.user?.foo?.id != params.id;
              } else if (action === "foo.create") {
                return context.user && (!context.user.foo || context.user.isAdmin); 
              }
              return true;
            }`,
          },
          {
            description: "user can get associated bar, admin can get all the bar",
            actions: ["bar.get"],
            scopes: ["foo", "foo.admin"],
            filter: ((action, params, context, utils) => {
              if (context.user?.isAdmin || params.id === context.user?.foo?.barId) {
                return true;
              }
              return false;
            }).toString(),
          },
        ],
        // ...see documents for detail
      },
    },
    // ...other service metadata
  },

  actions: {
    // ...implement actions
  },

  events: {
    "api.debug"({ payload }) {
      if (payload.origin.nodeID !== this.broker.nodeID) return;
      this.logger[payload.error ? "error" : "info"](payload);
    },
    // ...subscribe events
  },
};

const broker = new ServiceBroker();
broker.createService(FooService);
broker.start();
```

# Development
## 1. NPM Scripts
- `npm run dev [example=moleculer]` - Start development (nodemon with ts-node)
- `npm run build`- Uses typescript to transpile service to javascript
- `npm run lint` - Run TSLint
- `npm run deps`- Update dependencies
- `npm test` - Run tests & generate coverage report
- `npm test -- --watch` - Watch and run tests


# Contribution
Please send pull requests improving the usage and fixing bugs, improving documentation and providing better examples, or providing some testing, because these things are important.


# License
The project is available under the [MIT license](https://tldrlegal.com/license/mit-license).


# Contact
Copyright (c) 2019 QMIT Inc.

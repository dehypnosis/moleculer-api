# Table of contents

* [moleculer-api](../README.md)

## Quick Start

* [Get Started](quick-start/get-started.md)
* [Configurations](quick-start/configurations.md)
* [Quick Examples](quick-start/quick-examples/README.md)
  * [REST](quick-start/quick-examples/rest/README.md)
    * [REST Endpoints](quick-start/quick-examples/rest/rest-endpoints.md)
    * [REST File Upload with streaming](quick-start/quick-examples/rest/rest-file-upload-with-streaming.md)
  * [GraphQL](quick-start/quick-examples/graphql/README.md)
    * [GraphQL Resolver with DataLoader](quick-start/quick-examples/graphql/graphql-resolver-with-dataloader.md)
    * [GraphQL type extension and reference](quick-start/quick-examples/graphql/graphql-type-extension-and-reference.md)
  * [WebSocket](quick-start/quick-examples/websocket/README.md)
    * [WebSocket Video Broadcasting](quick-start/quick-examples/websocket/websocket-video-broadcasting.md)
    * [WebSocket Video Server/Client](quick-start/quick-examples/websocket/websocket-video-server-client.md)
    * [WebSocket Chat Server/Client](quick-start/quick-examples/websocket/websocket-chat-server-client.md)
  * [Authentication](quick-start/quick-examples/authentication/README.md)
    * [Parse OIDC/OAuth2 context](quick-start/quick-examples/authentication/parse-oidc-oauth2-context.md)
  * [Authorization](quick-start/quick-examples/authorization/README.md)
    * [Access Control with Auth token scopes](quick-start/quick-examples/authorization/access-control-with-auth-scope.md)
    * [Access Control with Auth token claims](quick-start/quick-examples/authorization/access-control-with-auth-token.md)
    * [Access Control with IP address](quick-start/quick-examples/authorization/access-control-with-ip-address.md)

## API Gateway

* [Overview](api-gateway/api-gateway.md)
* [Service Broker](api-gateway/service-broker/README.md)
  * [Connenctor](api-gateway/service-broker/connenctor.md)
  * [Delegator](api-gateway/service-broker/delegator.md)
* [Schema Registry](api-gateway/schema-registry/README.md)
  * [Branch, Version, Integration](api-gateway/schema-registry/branch-version-integration.md)
  * [Protocol Plugin](api-gateway/schema-registry/protocol-plugin.md)
  * [Policy Plugin](api-gateway/schema-registry/policy-plugin.md)
  * [API Handler](api-gateway/schema-registry/api-handler.md)
  * [API Document Generation](api-gateway/schema-registry/api-document-generation.md)
  * [Health Check](api-gateway/schema-registry/health-check.md)
* [API Server](api-gateway/api-server/README.md)
  * [Application](api-gateway/api-server/application/README.md)
    * [Component](api-gateway/api-server/application/component/README.md)
      * [HTTP](api-gateway/api-server/application/component/http.md)
      * [WebSocket](api-gateway/api-server/application/component/websocket.md)
    * [Context Factory](api-gateway/api-server/application/context-factory/README.md)
      * [Auth](api-gateway/api-server/application/context-factory/auth.md)
      * [Cookie](api-gateway/api-server/application/context-factory/cookie.md)
      * [Correlation ID](api-gateway/api-server/application/context-factory/correlation-id.md)
      * [IP Address](api-gateway/api-server/application/context-factory/ip-address.md)
      * [Locale](api-gateway/api-server/application/context-factory/locale.md)
      * [Request](api-gateway/api-server/application/context-factory/request.md)
      * [User-Agent](api-gateway/api-server/application/context-factory/user-agent.md)
  * [Middleware](api-gateway/api-server/middleware/README.md)
    * [Error](api-gateway/api-server/middleware/error.md)
    * [Logging](api-gateway/api-server/middleware/logging.md)
    * [Body Parser](api-gateway/api-server/middleware/body-parser.md)
    * [Helmet](api-gateway/api-server/middleware/helmet.md)
    * [CORS](api-gateway/api-server/middleware/cors.md)
    * [Serve Static](api-gateway/api-server/middleware/serve-static.md)
  * [HTTP](api-gateway/api-server/http.md)
  * [HTTPS](api-gateway/api-server/https.md)

## Service API Schema <a id="api-schema"></a>

* [Overview](api-schema/overview.md)
* [Branch](api-schema/branch.md)
* [Protocol Plugin](api-schema/protocol/README.md)
  * [REST](api-schema/protocol/rest.md)
  * [GraphQL](api-schema/protocol/graphql.md)
  * [WebSocket](api-schema/protocol/websocket.md)
* [Policy Plugin](api-schema/policy/README.md)
  * [Scope](api-schema/policy/scope.md)
  * [Filter](api-schema/policy/filter.md)

## Development

* [Overview](development/overview.md)
* [Service Broker Delegator](development/service-broker-delegator/README.md)
  * [Manipulating HTTP Response](development/service-broker-delegator/manipulating-http-response.md)
  * [Streaming Request/Response](development/service-broker-delegator/streaming.md)
  * [Bidirectional Streaming](development/service-broker-delegator/bidirectional-streaming.md)
* [Schema Registry](development/schema-registry-plugin/README.md)
  * [Protocol Plugin](development/schema-registry-plugin/protocol.md)
  * [Policy Plugin](development/schema-registry-plugin/policy.md)
* [API Server](development/server-application/README.md)
  * [Application Component](development/server-application/application-component.md)
  * [Application Context Factory](development/server-application/context.md)
  * [Middleware](development/server-application/middleware.md)

## Miscellaneous

* [Project Roadmap](miscellaneous/project-roadmap.md)
* [CHANGELOG](miscellaneous/changelog.md)
* [FAQ](miscellaneous/faq.md)
* [Contributors](miscellaneous/contributors.md)
* [Supporters](miscellaneous/supporters.md)

---

* [Github](https://github.com/qmit-pro/moleculer-api)
* [moleculer-iam](https://moleculer-api.gitbook.io/iam/)


# Project Roadmap



* [x] 0.1.x Pre-alpha
  * [x] Service Broker
    * [x] Service Registry which can discover and distinguish equally named but different services
    * [x] Collect action params and response, subscribed events examples
    * [x] Delegate action call with Dataloader batching support
    * [x] Delegate event publishing
    * [x] Delegate event subscription with either handler or async iterator
    * [x] Delegate health check
    * [x] Reporter which reports errors and information to origin services
    * [x] Inline function parser \(VM\)
    * [x] Explicit/implicit parameters mapping from service action validation schema 
    * [x] Support multiple Service Broker for a single gateway
    * [x] MoleculerJS Delegator
  * [x] Schema Registry
    * [x] Validate service API schema and report
    * [x] Integrations compile and major plugins
    * [x] REST protocol plugin
    * [x] GraphQL protocol plugin with subscription support
    * [x] Retry failed integrations compile
    * [x] Branch and version managements
  * [x] Logger
    * [x] Winston: also can be used with MoleculerJS delegator logger
  * [x] API Server
    * [x] Branch, Version specific routes while reusing handlers
    * [x] HTTP, WebSocket components \(express, ws modules\)
    * [x] HTTP protocol which mounts HTTP/WS components' modules
* [x] 0.2.x Alpha
  * [x] Middleware
  * [x] Helmet \(disabled by default\)
  * [x] CORS \(enabled, including WebSocket\)
  * [x] Serve Static \(disabled\)
  * [x] Body Parser \(enabled\)
  * [x] Logging \(enabled, including WebSocket\)
  * [x] Error Handler \(enabled, including WebSocket\)
  * \[X\] Context Factory
  * [x] ID \(enabled; request id generation\)
  * [x] User Agent \(enabled\)
  * [x] Cookie Parser \(enabled\)
  * [x] Locale \(enabled\)
  * [x] Auth \(enabled; Bearer/OAuth, Basic, Digest, AWS, [RFC7235](https://tools.ietf.org/html/rfc7235)\)
  * [x] Schema Registry plugins
    * [x] WebSocket protocol plugin
  * [x] Streaming support for GraphQL/REST plugin multipart/form-data request
  * [x] Streaming support for REST plugin response
  * [x] Bidirectional streaming support for WebSocket plugin
* [x] 0.3.x Beta
  * [x] Integration example with `moleculer-iam` \(OIDC provider\)
  * [x] Schema Registry plugins
    * [x] Filter access control policy plugin
    * [x] Scope access control policy plugin
    * [ ] Cache policy result in request context
  * [x] Gateway schema presets
    * [x] Service Catalog endpoints in REST
    * [x] Empty scheme placeholder in GraphQL
  * \[\] Normalized errors
* \[\] 1.0.x First Stable release
  * [x] API Server additional protocols
    * [x] HTTPS
    * \[\] HTTP2, HTTP2S
  * \[\] Integration example with `moleculer-file`
  * \[\] Unit tests coverage over 90%
  * \[\] Memory leak test
  * \[\] Stress test and performance profiling
  * \[\] Update documents and translate to English


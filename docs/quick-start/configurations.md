---
description: API Gateway constructor options.
---

# Configurations

## 1. APIGatewayOptions

APIGatewayOptions type is a kind of container for all the subordinate components' options.

```typescript
type APIGatewayOptions = {
  brokers?: RecursivePartial<ServiceBrokerOptions>[],
  schema?: RecursivePartial<SchemaRegistryOptions>,
  server?: RecursivePartial<APIServerOptions>,
  logger?: LoggerConstructorOptions,
} & RecursivePartial<APIGatewayOwnOptions>;
```

| name | default | description |
| :--- | :--- | :--- |
| brokers | - | Service Broker constructor options. Can configure multiple brokers for a single gateway. Service Broker discovers remote services and works as a delegator for calling remote service procedures and also deals with central event messages. |
| schema | - | Schema Registry constructor options. Schema Registry handles the integration of remote service API schema and creates API handlers. Can disable or configure detailed options for each API Schema Plugins like GraphQL, REST and WebSocket, etc. |
| server | - | API Server constructor options. Can configure API Server update policy, server components \(HTTP, WebSocket server\) and network interface \(HTTP, HTTPS\) detailed options, middleware options and request context factory options. |
| logger | - | Global logger options. Currently [winston](https://github.com/winstonjs/winston) logger is supported. |

### 

### 1.1. APIGatewayOwnOptions

Options for the gateway itself rather inner components.

```typescript
type APIGatewayOwnOptions = {
  skipProcessEventRegistration?: boolean,
};
```

| name | default | description |
| :--- | :--- | :--- |
| skipProcessEventRegistration | false | Set true to not to set default handlers for process interrupt signals like SIGINT. |



## 2. ServiceBrokerOptions

Service Broker options are consist of common properties and delegator specific properties. The common properties show below.

```typescript
type ServiceBrokerOptions = {
  registry: ServiceRegistryOptions;
  batching: BatchingPoolOptions;
  function: InlineFunctionOptions;
  reporter: ReporterOptions;
  log: {
    event: boolean;
    call: boolean;
  },
} & ServiceBrokerDelegatorConstructorOptions;
```

| name | default | description |
| :--- | :--- | :--- |
| registry | - | Options for the ServiceRegistry which collect remote services, available procedures and event types, etc. |
| batching | - | Options for batching feature which utilize [data-loader](https://github.com/graphql/dataloader) for concurrent multiple procedure calls. |
| function | - | Options for inline function \(JS function notation string\) sandbox. |
| reporter | - | Options for remote service reporter instance which reports API integration status, error or logging in inline function sandbox, etc. |
| log.event | true | Enable logging event messages. |
| log.call | true | Enable logging remote procedure call. |



### 2.1. ServiceRegistryOptions

```typescript
type ServiceRegistryOptions = {
  examples: {
    processIntervalSeconds: number;
    queueLimit: number;
    limitPerActions: number;
    limitPerEvents: number;
    streamNotation: string,
    omittedNotation: string,
    omittedLimit: number,
    redactedNotation: string,
    redactedParamNameRegExps: RegExp[];
  };
  healthCheck: {
    intervalSeconds: number;
  };
};
```

<table>
  <thead>
    <tr>
      <th style="text-align:left">name</th>
      <th style="text-align:left">default</th>
      <th style="text-align:left">description</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td style="text-align:left">examples</td>
      <td style="text-align:left">-</td>
      <td style="text-align:left">Options for the ServiceRegistry action (remote procedure), event example
        collecting feature.</td>
    </tr>
    <tr>
      <td style="text-align:left">examples.processIntervalSeconds</td>
      <td style="text-align:left">5</td>
      <td style="text-align:left">Consume example queue for every given intervals.</td>
    </tr>
    <tr>
      <td style="text-align:left">examples.queueLimit</td>
      <td style="text-align:left">50</td>
      <td style="text-align:left">Example queue size.</td>
    </tr>
    <tr>
      <td style="text-align:left">examples.limitPerActions</td>
      <td style="text-align:left">10</td>
      <td style="text-align:left">Maximum number of examples for a single action (remote procedure).</td>
    </tr>
    <tr>
      <td style="text-align:left">examples.limitPerEvents</td>
      <td style="text-align:left">10</td>
      <td style="text-align:left">Maximum number of examples for a single event.</td>
    </tr>
    <tr>
      <td style="text-align:left">examples.streamNotation</td>
      <td style="text-align:left">*STREAM*</td>
      <td style="text-align:left">Replace stream request and response of an example to given string.</td>
    </tr>
    <tr>
      <td style="text-align:left">examples.omittedNotation</td>
      <td style="text-align:left">*OMITTED*</td>
      <td style="text-align:left">Truncate example object&apos;s string property and append given suffix
        for...</td>
    </tr>
    <tr>
      <td style="text-align:left">examples.omittedLimit</td>
      <td style="text-align:left">100</td>
      <td style="text-align:left">The strings longer than given length.</td>
    </tr>
    <tr>
      <td style="text-align:left">examples.redactedNotation</td>
      <td style="text-align:left">*REDACTED*</td>
      <td style="text-align:left">React example object&apos;s string property to given string for...</td>
    </tr>
    <tr>
      <td style="text-align:left">examples.redactedParamNameRegExps</td>
      <td style="text-align:left">
        <p><code>[</code>
        </p>
        <p><code>/password/i,</code>
        </p>
        <p><code>/secret/i,</code>
        </p>
        <p><code>/credential/i,</code>
        </p>
        <p><code>/key/i,</code>
        </p>
        <p><code>/token/i,</code>
        </p>
        <p><code>]</code>
        </p>
      </td>
      <td style="text-align:left">
        <p>Matched strings with given regular expressions.</p>
        <p></p>
      </td>
    </tr>
    <tr>
      <td style="text-align:left">healthCheck</td>
      <td style="text-align:left">-</td>
      <td style="text-align:left">Options for the ServiceRegistry health check feature.</td>
    </tr>
    <tr>
      <td style="text-align:left">healthCheck.intervalSeconds</td>
      <td style="text-align:left">10</td>
      <td style="text-align:left">Health check for every given intervals.</td>
    </tr>
  </tbody>
</table>



### 2.2. BatchingPoolOptions

```typescript
type BatchingPoolOptions = {
  batchingKey: (...args: any[]) => any;
  entryKey: (batchingParams: any) => any;
  failedEntryCheck: (entry: any) => boolean;
  entriesLimit: number;
};
```

| name | default | description |
| :--- | :--- | :--- |
| batchingKey | \(hash function\) | A keygen function for the key of same batching arguments. Create hash string with args object by default. |
| entryKey | \(hash function\) | A keygen function for the variable params of each batched entries. |
| failedEntryCheck | `entry => entry && entry.batchingError` | A function to determine whether each entries are failed or not in a batch response. By default, a remote procedure which supports batching should response `{ ..., batchingError: true }` object for failed entry. |
| entriesLimit | 100 | Maximum number of entries for a single batch. |



### 2.3. InlineFunctionOptions

```typescript
type InlineFunctionOptions = {
  util: {[key: string]: any};
};
```

| name | default | description |
| :--- | :--- | :--- |
| util | `{}` | Any kind of object which can be accessed as global `util` variable from inline functions. |



### 2.4. ReporterOptions

```typescript
type ReporterOptions = {
  tableWidthZoomFactor: number;
};
```

| name | default | description |
| :--- | :--- | :--- |
| tableWidthZoomFactor | 1 | A reporter sends a report which is consist of raw messages and a  string that prints messages as a shape of a table. For that table, set a zoom factor of the width. |



### 2.5. ServiceBrokerDelegatorConstructorOptions

Specific options for the Service Broker Delegator. Can choose only one among supported delegators. Currently [moleculer](https://moleculer.services/) delegator is supported.

```typescript
type ServiceBrokerDelegatorConstructorOptions = {
  moleculer?: MoleculerServiceBrokerDelegatorOptions,
  [otherDelegatorKey]?: any,
};
```

| name | default | description |
| :--- | :--- | :--- |
| moleculer | - | [moleculer](https://moleculer.services/) Service Broker Delegator options. |

#### 

### 2.5.1. MoleculerServiceBrokerDelegatorOptions

[moleculer](https://moleculer.services/) delegator can be configured with moleculer broker own options and few extra options like below.

```typescript
import * as Moleculer from "moleculer";

type MoleculerServiceBrokerDelegatorOptions = Moleculer.BrokerOptions & {
  batchedCallTimeout?: (itemCount: number) => number;
  streamingCallTimeout?: number;
  streamingToStringEncoding?: "ascii" | "utf8" | "utf-8" | "utf16le" | "ucs2" | "ucs-2" | "base64" | "latin1" | "binary" | "hex";
  services?: Moleculer.ServiceSchema[];
};
```

| name | default | description |
| :--- | :--- | :--- |
| batchedCallTimeout | \(return 5-60s based on item count\) | A function to calculate the timeout options for a batched call. |
| streamingCallTimeout | 3600000 \(1 hour\) | A timeout options for a streaming call \(ms\). |
| streamingToStringEncoding | base64 | An encoding which is used to transform streaming data to buffer data. This is for the case that non-root property of payload is a readable stream. Because moleculer service broker can pipe only a single streaming data at once in a single params, a gateway needs to transform non-root streaming data to buffer data before proxy the action call. Try to check your moleculer service broker transporter options and this option for a malformed streaming data issue. |
| services | `[]` | Given `Moleculer.ServiceSchema[]` would be registered on moleculer service broker started. This is for the testing convenience. |

#### 

## 3. SchemaRegistryOptions

Service Registry options are consist of own options for the registry itself and Protocol, Policy, this two type of Plugin constructor options.

```typescript
type SchemaRegistryOptions = {
  maxVersions: number;
  maxUnusedSeconds: number;
  protocol: ProtocolPluginConstructorOptions,
  policy: PolicyPluginConstructorOptions,
};
```

| name | default | description |
| :--- | :--- | :--- |
| maxVersions | 10 | Maximum number of old versions for each branches. |
| maxUnusedSeconds  | 1800 | Maximum unused duration until deleting non-master branches. |
| protocol | - | A ProtocolPlugin handles mapping Public API to calling internal services' procedure, publishing and subscribing event messages. |
| policy | - | A PolicyPlugin handles access controls \(authorization\) while calling internal services' procedure, publishing and subscribing event messages. |



### 3.1. ProtocolPluginConstructorOptions

```typescript
type ProtocolPluginConstructorOptions = {
  GraphQL: RecursivePartial<GraphQLProtocolPluginOptions> | false,
  REST: RecursivePartial<RESTProtocolPluginOptions> | false,
  WebSocket: RecursivePartial<WebSocketProtocolPluginOptions> | false,
}
```

 ...



### 3.2. PolicyPluginConstructorOptions



## 4. APIServerOptions

...

## 5. LoggerConstructorOptions






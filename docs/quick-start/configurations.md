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

## 1.1. APIGatewayOwnOptions

Options for the gateway itself rather inner components.

```typescript
type APIGatewayOwnOptions = {
  skipProcessEventRegistration?: boolean,
};
```

| name | default | description |
| :--- | :--- | :--- |
| skipProcessEventRegistration | false | Set true to not to set default handlers for process interrupt signals like SIGINT. |

## 1.2. ServiceBrokerOptions

...




# Delegator implementation consensus

## 1. Streaming Request

Handling streaming request is up to delegator. To support streaming request, delegator should handle `{ createReadStream(): ReadableStream, ...meta: any }` params as their own way.

### 1.1. REST file upload example

```javascript
{
  method: "POST",
  action: "file.upload",
  params: "@body.file",
}
```

When multipart/form-data request with 'file' field is mapped to above REST API schema. REST protocol plugin will delegate action call with params as below.

```text
{
  filename: string;
  encoding: "utf8"|"7bit"|"base64"|...;
  mimetype: string;
  createReadStream(): ReadableStream;
}
```

### 1.2. GraphQL file upload example

```javascript
{
    typeDefs: `
        extend type Mutation {
            uploadFile(file: Upload): JSON
        }
    `,
    resolvers: {
      Mutation:  {
        uploadFile: {
          call: "file.upload", 
          params: "@args.file",
        },
      },
    },
}
```

When [GraphQL multipart/form-data request](https://github.com/jaydenseric/graphql-multipart-request-spec#graphql-multipart-request-specification) is mapped to above GraphQL API schema. GraphQL protocol plugin will delegate action call with params as below.

```text
{
  filename: string;
  encoding: "utf8"|"7bit"|"base64"|...;
  mimetype: string;
  createReadStream(): ReadableStream;
}
```

For WebSocket protocol, see 4.

## 2. Streaming Response

Handling streaming response is up to protocol plugins. For REST protocol, any response from delegator like below will be handled as stream response with `{ "Content-Type": "application/octet-stream", "Transfer-Encoding": "chunked" }` headers.

```text
{
  createReadStream(): ReadableStream,
  ...,
}
```

For GraphQL protocol, above features just ignored.

For WebSocket protocol, see 4.

## 3. Modify Response Header/Status

Also for REST protocol, can modify response with `$headers`, `status` properties in delegator response.

```text
{
  createReadStream(): ReadableStream,
  $headers: {
    "Content-Type": "text/html; charset=utf-8",
  },
}
```

It is not only for the streaming response. below delegator response will also modify response headers.

```text
{
  $headers: {
    "Status": "301 Moved Permanently",
    "Location": "https://some.where.to.go.com",
  },
  $status: 302,
}
```

For GraphQL protocol, this feature is just ignored. For WebSocket protocol, this feature is just ignored.

## 4. Bidirectional Streaming

WebSocket protocol supports bidirectional streaming. // TODO: documentation


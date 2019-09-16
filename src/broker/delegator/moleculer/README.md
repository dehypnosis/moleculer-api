# Implicit features for Moleculer API Gateway Service Broker

## Streaming Request
Call action with `{ stream: ReadableStream instance, meta?: object }`

## Metadata Response
- before call, ctx.meta had `{ a, b }`
- after call, `ctx.meta` now has `{ a, b, c: "added meta prop" }`
- then API Gateway service broker will got `{ ...<other response props>, meta: { c } }`

## Streaming Response
- call, response is an instance of `<ReadableStream>`
- then API Gateway service broker will got `{ ...<other response props>, stream: <ReadableStream> }`

# Overview

## Overview

Moleculer API Gateway는 분산 서비스 환경에서 동적으로 마이크로 서비스들의 API 스키마를 수집하고 조합하며 무중단으로 API를 제공하는 웹 서버 모듈입니다.

서비스 API 스키마는 분산 서비스의 프로시저\(이하 **액션**\)의 호출\(`call`\)이나 중앙 메시징 서비스에 대한 **이벤트** 발행\(`publish`\) 및 구독\(`subscribe`\)을 웹 기반 프로토콜\(REST, GraphQL, WebSocket 지원\)의 엔드포인트에 맵핑합니다. 서비스 API 스키마는 단일한 JSON 포맷으로 구성되어있으며 각 맵핑에 대한 접근 제어 정책을 포함 할 수 있습니다.

서비스 API 스키마가 제거, 수정, 추가되면 Gateway는 기존 통합 API 스키마에 병합을 시도하고 성공시 무중단으로 라우터를 업데이트하며 그 결과 메시지를 원격 서비스에 다시 보고합니다.

### Features

* 분산 서비스의 API 스키마를 수집하고 병합하여 API를 실시간으로 업데이트
* 개발 편의를 위한 브랜치 및 태그
* 상태 검사 및 문서 생성
  * API Gateway 상태 검사
  * API 엔드포인트별 상태 검사
  * API 엔드포인트별 설명, 파라미터, 접근 제어 정보 생성
  * 분산 서비스 액션 및 이벤트 구독, 발행 정보 생성
* 확장 가능한 웹 서버 구성
  * Cookie/Body Parser
  * ETag
  * CORS
  * HTTP/2
  * TLS
* 미들웨어 방식의 컨텍스트 생성
  * 인증
  * Locale
* 프로토콜 플러그인 \(핸들러 및 스키마 확장\)
  * REST
  * GraphQL
  * WebSocket \(TODO\)
* 접근 제어 정책 플러그인 \(핸들러 및 스키마 확장\)
  * OAuth2 scope 기반 접근 제어
  * JavaScript [FBAC; Function Based Access Control](https://arxiv.org/abs/1609.04514) 기반 접근 제어 

### Service Brokers

API Gateway는 최초에 [Moleculer](https://moleculer.services) MSA 라이브러리를 배경으로 개발되었지만, 확장성을 위해서 강한 디커플링을 방침으로 개발되고 있습니다.

API Gateway는 분산 서비스 및 중앙 메시징 서비스와의 네트워킹을 서비스 브로커에게 위임합니다. 서비스 브로커는 분산 서비스들의 네트워킹을 위임 받으며, `call`, `publish`, `subscribe`, `discover`, `report` 등의 주요 네트워킹 인터페이스\(커넥터\)를 가진 어댑터와 결합됩니다.

#### 1. MoleculerJS

MoleculerJS 어댑터로 API Gateway 함께와 아래의 피어 모듈을 활용 할 수 있습니다.

* [moleculer-iam](https://github.com/qmit-pro/moleculer-iam) - OIDC 및 Identity Provider를 제공하는 IAM 모듈, 인증 컨텍스트에 연동 가능
* [moleculer-file](https://github.com/qmit-pro/moleculer-file) - 파일 업로드/다운로드/관리 모듈 \(GCP Storage bucket backend / File System backend 지원\)
* [moleculer-i18n](https://github.com/qmit-pro/moleculer-i18n) - 국제화 데이터베이스 관리 및 조회 모듈 \(MySQL/Maria DBMS 필요\)
* [moleculer-console](https://github.com/qmit-pro/moleculer-console) - 확장 가능한 Admin Console WebApp \(React.js\)
  * API document component 기본 제공 \([moleculer-api](https://github.com/qmit-pro/moleculer-api) 호환\)
  * IAM component 기본 제공 \([moleculer-iam](https://github.com/qmit-pro/moleculer-iam) 호환\)
  * File management component 기본 제공 \([moleculer-file](https://github.com/qmit-pro/moleculer-file) 호환\)
  * Translation component 기본 제공 \([moleculer-i18n](https://github.com/qmit-pro/moleculer-i18n) 호환\)
* [moleculer-go](https://github.com/moleculer-go) 및 프로토콜이 호환되는 폴리글랏한 Moleculer 서비스의 API를 수집 할 수 있습니다.
* TOC

  {:toc}

## API Schema and Handler

### 1. Design Principle

Moleculer API Gateway는 아래 원칙을 기반으로 고안되었습니다.

* 분산 시스템안에서 유동적으로 작동합니다.
  * Persistence Layer를 갖지 않습니다.
* "분산 서비스 -&gt; API" 종속성을 최소화합니다.
  * 서비스 API 스키마는 JSON 텍스트입니다.
  * 분산 서비스 호출시 인증 등의 컨텍스트를 파라미터로 맵핑하도록 유도합니다.
* 확장 가능한 컴포넌트 패턴을 지향합니다.
  * 프로토콜 플러그인은 서버, 미들웨어, 스키마, 핸들러의 모든 부분을 확장합니다.
  * 접근 제어 정책은 프로토콜별 엔드포인트가 아닌 액션, 이벤트에 적용됩니다.
* 네트워킹 및 복원 패턴에 관여하지 않습니다.
  * 분산 서비스와 API Gateway는 어댑터\(Broker\)로 연결됩니다.
  * 분산 트랜잭션을 유도하거나 관여하지 않습니다.

아울러 분산 서비스 및 서비스 브로커에서 기대되는 패턴은 다음과 같습니다.

* 분산 서비스의 프로시저는 무상태를 지향합니다.
  * 프로시저는 인증 컨텍스트를 고려하지 않습니다.
  * 프로시저는 접근 제어를 고려하지 않습니다.
  * 프로시저는 가능한 멱등성을 갖도록 고려됩니다.
* 서비스 브로커는 분산 시스템을 위한 복원 패턴을 구성합니다.
  * 회로차단기
  * 격벽
  * 재시도
  * 요청 큐

### 2. API Schema

이하에서 **서비스 API 스키마**는 분산 환경의 부분적인 API 스키마를 의미합니다. **Gateway API 스키마**는 Gateway에서 통합된 API 스키마를 의미합니다.

서비스 API 스키마는 JSON 텍스트로 Gateway에 전달됩니다. 스키마 데이터의 직렬화 및 비직렬화는 MSA 라이브러리에 달렸습니다. 아래 예시에서는 Node.js 환경을 기준으로 서비스 API 스키마를 JavaScript 객체로 표기합니다.

```javascript
{
  branch: "master",
```

제거 할 수 없는 기본 브랜치는 `master` 브랜치입니다. 이외의 브랜치를 명시하여 브랜치를 생성하거나 업데이트 할 수 있습니다. 브랜치 관련 내용은 아래에서 다시 다룹니다.

```javascript
  protocol: {
```

이하 protocol 항목에 외부에 제공하려는 API를 작성하고 `call`, `publish`, `subscribe`, `map` 커넥터에 맵핑합니다. 각 커넥터에 대한 추가적인 내용은 아래 [Connectors for API Handler](docs.md#d-connectors-for-api-handler) 섹션에서 다룹니다.

#### A. REST

REST API 맵핑에는 `subscribe`를 제외한 `call`, `publish`, `map` 커넥터를 이용 할 수 있습니다.

```javascript
    REST: {
      basePath: "/players",
      description: "player service REST API",
      routes: [
```

`basePath`를 기반으로 이하 REST 엔드포인트가 생성됩니다.

`description`은 문서 생성시 활용되며 Markdown을 지원합니다 \(옵션\).

**Call**

```javascript
        {
          method: "GET",
          path: "/:id",
          deprecated: false,
          description: "Get player information by id",
          call: {
            action: "player.get",
            params: {
              id: "@path.id",
            },          
          },
        },
```

`GET /players/1` 요청이 `player.get` 액션을 `{ id: 1 }` 페이로드와 함께 호출하고 성공시 그 결과를 반환합니다.

`depreacted`는 문서 생성시 활용됩니다 \(옵션\).

라우트 path를 구성하는 규칙은 [path-to-regexp](https://github.com/pillarjs/path-to-regexp#parameters)를 참고 할 수 있습니다.

```javascript
        {
          method: "GET",
          path: "/me",
          deprecated: false,
          description: "Get player information of mine",
          call: {
            action: "player.get",
            params: {
              id: "@context.user.player.id",
            },          
          },
        },
```

`GET /players/me` 요청이 `player.get` 액션을 `{ id: <인증 컨텍스트의 player.id> }` 정보로부터 페이로드와 함께 호출하고 성공시 그 결과를 반환합니다.

**Map**

```javascript
        {
          method: "GET",
          path: "/me",
          deprecated: false,
          description: "Get player information of mine",
          map: `({ path, query, body, context }) => context.user.player`,
        },
```

또는 `map` 커넥터 \(Inline JavaScript Function String\)를 통해 인증 컨텍스트의 `player` 객체를 바로 반환 할 수 있습니다. 이후에 다시 다루는 Inline JavaScript Function String은 API Gateway의 Node.js VM 샌드박스에서 해석됩니다.

**Publish**

```javascript
        {
          method: "POST",
          path: "/message",
          deprecated: false,
          description: "Push notifications to all players",
          publish: {
            event: "player.message",
            broadcast: false,
            params: {
              userId: "@context.user.player.id",
              message: "@body.message",
            },
          },
        },
```

`POST /players/1` \(body: `{ message: "blabla" }`\) 요청은 `player.message` 이벤트를 `{ userId: id: <인증 컨텍스트의 player.id>, message: "blabla" }` 페이로드와 함께 `publish`하고 성공시 발송된 페이로드를 응답합니다.

```javascript
      ],
    },
```

**Params**

REST API의 `params` 맵핑에는 `@path`, `@body`, `@query`, `@context` 객체를 이용 할 수 있습니다.

```javascript
// @body 객체 전체를 페이로드로 전달하거나 스트림을 전달 할 때 이용됩니다.
params: "@body",

// @ 문자열로 시작되지 않는 값들은 해석되지 않고 그대로 전달됩니다.
params: {
  foo: "@path.foo", // will bar parsed
  bar: "query.bar", // will be "query.bar"
  zzz: ["any", { obj: "ject", can: "be", "use": 2 }],
},

// 항상 string 타입을 갖는 @query, @path 객체의 속성들에 한해서 타입을 boolean이나 number로 변환 할 수 있습니다.
params: {
  foo: "@path.foo:number",
  bar: "@query.bar:boolean",
},
```

#### B. GraphQL

GraphQL API 맵핑에는 `call`, `publish`, `subscribe`, `map` 커넥터를 이용 할 수 있습니다.

**TypeDefs**

```javascript
    GraphQL: {
      typeDefs: `
        """Soccer Player"""
        type Player implements Node {
          id: ID!
          email: String!
          name: String!
          photoURL: String
          position: String
          """A team player belongs to"""
          team: Team
        }

        extend type Query {
          """Current Player"""
          viewer: Player
          player(id: ID!): Player
        }

        extend type Subscription {
          playerMessage: String!
          playerUpdated: Player
        }
      `,
```

GraphQL 프로토콜에서 `typeDefs` 속성에 서비스에 필요한 정의\(`scalar`를 제외한 타입, 인터페이스, 열거형 등 모든 형태\)을 추가하거나 기존 타입\(API Gateway에서 제공하는 기본 타입과 분산 서비스에서 제공한 타입들\)을 확장 할 수 있습니다.

**Resolvers**

```javascript
      resolvers: {
```

이하 리졸버에 각 타입들의 필드를 `call`, `publish`, `subscribe`, `map` 커넥터에 맵핑합니다.

```javascript
        Player: {
```

리졸버가 할당되지 않은 필드들은 source 객체에서 동일한 이름의 속성으로부터 주입됩니다.

**Call**

```javascript
          team: {
            call: {
              action: "team.get",
              params: {
                id: "@source.teamId",
              },
            },
          },
```

GraphQL API의 `Query` 및 `Mutation` 타입의 필드들에는 `publish` 및 `call` 또는 `map` 커넥터를 이용 할 수 있습니다. `params` 맵핑에는 `@source`, `@args`, `@context`, `@info`를 이용 할 수 있습니다.

**Map**

```javascript
          position: `({ source, args, context, info }) => source.position.toUpperCase()`,
`
```

GraphQL 프로토콜에서 `map` 커넥터 \(Inline JavaScript Function String\)는 간략하게 `field: { map: <FN_STRING> }` 대신에 `field: <FN_STRING>` 방식으로 작성 할 수 있습니다.

```javascript
          // be noted that special field __isTypeOf got only three arguments
          __isTypeOf: `({ source, context, info }) => return source.someSpecialFieldForThisType != null`,

          // be noted that special field __resolveType got only three arguments
          __resolveType: `
            ({ source, context, info }) => {
              if (source.someSpecialFieldForThisType != null) {
                return "TypeA";
              } else {
                return "TypeB";
              }
            }
          `,
        },
```

위처럼 Union, Interface 구현 타입을 해석하기 위한 특수 필드에도 Inline JavaScript Function String를 사용합니다.

**Batched Call \(DataLoader\)**

```javascript
        Query: {
          viewer: {
            call: {
              action: "player.get",
              params: {
                id: "@context.user.player.id[]",
              },
            },
          },
          player: {
            call: {
              action: "player.get",
              params: {
                id: "@args.id[]",
              },
            },
          },
        },
```

위처럼 인증 정보를 포함한 `@context`나 GraphQL 필드 인자인 `@args`를 활용해 동일한 액션을 서로 다른 방식으로 맵핑 할 수 있습니다.

또한 `call` 메소드는 GraphQL 요청에서 발생하기 쉬운 N+1 쿼리를 방지하기 위해 요청을 배치로 처리 할 수 있도록 설계되었습니다. \(ref. [Dataloader](https://github.com/graphql/dataloader)\)

한 컨텍스트에서 여러번 호출되는 액션에 배칭을 지원하면 응답 속도를 획기적으로 높힐 수 있습니다. 배칭을 활성화하기 위해서는 `call` 커넥터의 `batchedParams` 필드에 배치 처리가 가능한 필드의 이름을 작성하고, 연결된 서비스 액션이 배열로 들어오는 인자 묶음을 처리 할 수 있도록 합니다.

```text
query {
  viewer {
    id
    email
  }
  one: player(id: 1) {
    id
    email
  }
  two: player(id: 2) {
    id
    email
  }
  three: player(id: 3) {
    id
    email
  }
}
```

위와 같은 GraphQL 요청은 `player.get` 액션을 `{ id: [context.user.player.id, 1, 2, 3], ...(other common params) }` 페이로드와 함께 한번만 호출하게 됩니다. 연결된 액션이 `[{ ... }, { ... }, { ... }, { ... }]` 묶음으로 응답을 주면 각 필드에 해당하는 응답이 할당됩니다.

만약 `id: 3`인 플레이어가 없는 경우 배치 요청을 처리하는 과정에서 에러를 발생시켜 제어 흐름을 멈추는 대신에, 에러를 발생키지않고 배치 응답에 포함시키고 나머지 제어 흐름을 마무리합니다. `[{ ... }, { ... }, { ... }, { message: "...", isBatchError: true, ... }]` 처럼 `isBatchError: true` 속성을 갖는 에러 객체를 응답에 포함합니다.

**Subscribe**

```javascript
        Subscription: {
          playerMessage: {
            subscribe: {
              events: ["player.message"],
            },
          },
```

GraphQL API의 `Subscription` 타입의 필드에서는 `subscribe` 커넥터를 사용 할 수 있습니다. `params` 맵핑에는 마찬가지로 `@source`, `@args`, `@context`, `@info`를 이용 할 수 있습니다. `@source`에 이벤트 객체가 맵핑됩니다.

`@source` 객체는 `{ event, payload }`로 구성됩니다. Broker에 따라 기타 속성이 추가 될 수 있습니다.

```javascript
          playerMessage: {
            subscribe: {
              events: ["player.message"],
              map: `({ source, args, context, info }) => source.payload.message`,
            },
          },
        },
      },
    },
```

`subscribe` 커넥터에서는 위처럼 수신된 이벤트 페이로드를 다시 `map` 커넥터로 변환 할 수 있습니다. `subscribe` 커넥터 안에서 `map` 커넥터가 사용되지 않는 경우 이벤트 객체 전체\(`source`\)를 반환합니다.

#### C. WebSocket

```javascript
    WebSocket: {
      // TODO: WIP
    },
```

#### D. Access Control Policy

```javascript
  },
```

위에 정의한 각 프로토콜들의 엔드포인트는 서비스 브로커의 `call`, `publish`, `subscribe` 커넥터를 호출합니다. 이 때 호출되는 각 커넥터들에 대해서 접근 제어 정책을 정의 할 수 있습니다.

```javascript
  policy: {
```

접근 제어 정책은 먼저 호출하는 커넥터에 따라서 `action`이나 `event`의 이름으로 필터링됩니다. 연관된 정책들은 순서대로 모두 적용됩니다. 모든 정책을 통과하는 경우에 해당 커넥터가 호출될 수 있습니다.

접근 제어 정책을 평가하는 방식은 플러그인 형태로 제공됩니다. 기본적으로 OAuth scope 방식\(`scopes`\)과 Inline JavaScript Function String를 활용한 FBAC 방식\(`filter`\) 두가지가 제공됩니다.

**Scopes**

```javascript
    call: [
      {
        description: "admin can remove player, newbie and admin can create player",
        actions: ["player.**"],
        scopes: ["player", "player.admin"],
```

위 정책은 `player.**` 패턴\(`player.get`, `player.list`, `player.message.list` 등과 일치\)의 액션을 호출하는 `call` 커넥터가 사용되는 모든 엔드포인트가 수행되기 전에 공통적으로 평가됩니다. 우선 `scopes` 접근 제어 플러그인에 따라 `context`에 주입된 \(`moleculer-iam` 같은 컨텍스트 플러그인을 통해\) OAuth 토큰이 획득한 스코프를 확인하고 일치되는 스코프가 하나라도 있는 경우 통과합니다.

**Filter**

```javascript
        filter: `({ action, params, context, util }) => {
          if (action === "player.remove") {
            return context.user.player.isAdmin && context.user.player.id != params.id;
          } else if (action === "player.create") {
            return context.user && (!context.user.player || context.user.player.isAdmin); 
          }
          return true;
        }`,
      },
```

다음으로 `filter` 접근 제어 플러그인에 따라 `action`\|`event`, `params`, `context`, `util`을 주입하여 함수를 실행하며, `true` 값이 반환되는 경우 통과합니다. FBAC은 ACL이나 RBAC처럼 대중화되지는 않았으나, ABAC의 확장 모델로 이해할 수 있습니다. 매우 유연하여 분산 환경에 적합하며 프로덕션에서 검증된 방식입니다.

`filter` 접근제어 플러그인 역시 `map` 커넥터처럼 Gateway의 Node.js VM 샌드박스에서 실행됩니다. `filter` 함수를 평가하는 중에 에러가 발생하는 경우 디버그 메시지가 Gateway에서 출처 노드로 전달되며 접근이 거부됩니다.

```javascript
      {
        description: "player can get associated team, admin can get all the teams",
        actions: ["team.get"],
        scopes: ["player", "player.admin"],
        filter: (({ action, params, context, util }) => {
          if (context.user.player.isAdmin || params.id === context.user.player.teamId) {
            return true;
          }
          return false;
        }).toString(),
      },
    ],
```

위처럼 `player` 서비스의 API 스키마는 꼭 `player` 서비스의 액션만 호출하지 않습니다. 따라서 `player` API에서 노출하는 `team` 서비스의 액션에 대한 접근 제어 역시 `player` 스키마에서 정의하게 됩니다.

```javascript
    publish: [
      {
        description: "Only admins can publish player events",
        events: ["player.**"],
        scopes: ["player"],
        filter: (({ event, params, context, util }) => {
          return context.user.player.isAdmin;
        }).toString(),
      },
    ],
```

`publish`, `subscribe` 커넥터의 정책에는 `actions` 대신 `events` 필드가 작성됩니다.

```javascript
    subscribe: [
      {
        events: ["player.**"],
        description: "Any user can receive player events",
        scopes: ["openid"],
      },
    ],
  },
}
```

위처럼 `filter`가 생략된 경우 `scopes`만 적용되며 `filter`는 통과한 것처럼 평가됩니다. 하지만 Gateway에서 활성화된 플러그인이 커넥터 수행시 활성화 되지 않는 경우에는, 지속적으로 경고 메세지가 Gateway에서 출처 노드로 전달되고 API 문서에 경고 문구가 나타납니다.

**Bypass Warning**

```javascript
{
  actions: ["**"],
  scopes: ["**"],
  filter: `() => true`,
}
```

경고를 회피하기 위해서는 접근제어 플러그인을 비활성화하거나 위 같은 정책을 작성 할 수 있습니다.

```javascript
{
  actions: ["**"],
  scopes: ["**"],
  filter: `(action, params, context) => {
    console.log("policy filter", action, params, context);
  }`,
}
```

디버깅 중에 Inline JavaScript Function String에서 `console` 객체를 사용해 메세지를 출력하는 경우, 그 메세지는 Gateway의 VM 안에서 출력되지 않고 Gateway가 출처 노드로 전달합니다.

**Caching**

또한 접근 제어 정책의 평가는 Gateway의 메모리에 LRU 방식으로 캐시되며 한 요청에서 중복 수행되지 않습니다. 캐시 키를 생성 할 때 요청을 정확히 구분하기 위해서 컨텍스트\(인증 정보\) 및 호출 페이로드 등의 정보가 반영됩니다.

### 3. API Handler

#### A. Schema Integration

서비스 API 스키마는 서비스 브로커에 의존해 Gateway로 수집되고 처리됩니다. Moleculer 어댑터로 작성된 서비스 브로커의 경우 기본적으로 `ServiceSchema`의 `metadata.api` 필드에서 서비스 API 스키마가 수집되기를 기대합니다.

서비스 API 스키마의 병합은 서비스 노드의 연결, 종료, 스키마 변경시 발생합니다. 서비스 API 스키마는 자신의 스키마를 병합 할 브랜치를 스키마에 명시합니다. Gateway에는 기본적으로 `master` 브랜치가 생성되어있으며, `master` 브랜치는 제거 될 수 없습니다.

**Integration Process**

병합 규칙은 다음과 같습니다.

* discover
  * `discover` 발생 즉시 병합 요청이 생성됩니다.
  * 프로토콜 플러그인을 따라 스키마 포맷에 대한 검증을 거칩니다.
    * 포맷 에러는 병합 요청 메세지 리스트에 포함됩니다.
    * 접근 제어를 우회하는 엔드포인트에 대한 경고가 병합 요청 메세지 리스트에 포합됩니다.
  * 검증 성공시 병합 요청이 큐에 삽입되면서 특정 시간\(2초를 기본값\) 동안 debounce 후 순차적으로 처리됩니다.
    * 큐에서 특정 서비스에 대한 병합 요청이 다수인 경우 마지막 요소만 유효합니다.
    * 프로토콜 플러그인에서 `integrationDependencyResolver`가 구현된 경우 \(eg. GraphQL\) 큐 안에서 처리 순서가 조정 될 수 있습니다.
  * 검증 실패시 `report` 단계로 건너 뜁니다.
* hash
  * 서비스 API 스키마에서 `branch`, `description`, `deprecated`등의 메타 정보를 제외한 스키마 객체 전체를 MD5 해싱하여 고유한 버전 해시를 생성합니다.
  * 게이트웨이에 버전이 존재하지 않는 경우에는 스키마를 업데이트하기로 합니다.
  * 서비스 노드의 연결이 끊긴 경우는 연관된 스키마의 노드풀에서 노드를 삭제합니다.
    * 이 때 연관된 스키마들에서 노드풀이 빈 스키마들을 제거하기로 합니다.
* update
  * `master` 브랜치의 스키마는 경우에는 모든 브랜치에 병합이 시도됩니다.
    * 이 때 `master` 외의 브랜치에서 스키마의 서비스명이 중복되는 경우 병합하지 않습니다. 기존 스키마의 우선 순위가 높습니다.
  * 이외의 브랜치에 병합하는 경우에는 주어진 브랜치에만 병합이 시도됩니다.
  * 프로토콜 플러그인을 따라 각 프로토콜별 핸들러를 생성합니다.
    * 병합에 성공하면 생성된 Gateway API 스키마 버전에 `latest` 태그 및 8 글자의 숏 해시\(eg. `abcdefgh`\)가 태그로 부착됩니다.
  * 옵션이 활성화된 경우 브랜치별 API Catalog를 업데이트합니다.
  * 옵션이 활성화된 경우 브랜치별 Service Catalog를 업데이트합니다.
* report
  * 병합 요청의 메세지 리스트를 기반으로 디버그 메세지를 생성합니다.
  * 병합 요청의 출처 노드로 디버그 메세지를 `report`합니다.

**Branch Strategy Diagram**

브랜치간 병합 전략을 표로 도식하면 다음과 같습니다.

표에서 `a@v1`는 `a` 서비스 스키마 중 `v1` 버전을 의미합니다.

| 이벤트/브랜치 | master | dongwook | 비고 |
| :--- | :--- | :--- | :--- |
| initial schema | `(empty)` | N/A |  |
| `a` added to `master` | `a@v1` | N/A |  |
| `a` updated to `master` | `a@v2` | N/A |  |
| `b` added to `dongwook` | `a@v2` | `a@v2` `b@v1` | 새로운 `b` 서비스를 `dongwook` 브랜치로 분기해서 작업; 충돌하지 않는 스키마들은 복제되지 않고 참조됩니다. |
| `a` updated to `master` | `a@v3` | `a@v3` `b@v1` | `master` 브랜치의 업데이트는 모든 브랜치로 전파됩니다. |
| `a` updated to `dongwook` | `a@v3` | `a@v4` `b@v1` | `master` 이외의 브랜치의 업데이트는 자기 브랜치로만 전파됩니다. |
| `a` updated to `master` | `a@v3-2` | `a@v4` `b@v1` | 충돌하는 경우 자기 브랜치 스키마의 우선 순위가 높습니다. |
| `c` added to `master` | `a@v3-2` `c@v1` | `a@v5` `b@v1` `c@v1` | `master` 브랜치의 업데이트는 모든 브랜치로 전파됩니다. |
| `b` added to `master` | `a@v3-2` `b@v1` `c@v1` | `a@v5` `b@v1` `c@v1` | 개발된 `b` 서비스를 `dongwook` 브랜치에서 `master` 브랜치로 변경 |
| `a` updated to `master` | `a@v5` `b@v1` `c@v1` | `a@v5` `b@v1` `c@v1` | 수정된 `a` 서비스를 `dongwook` 브랜치에서 `master` 브랜치로 변경 |
| `dongwook` branch removed | `a@v5` `b@v1` `c@v1` | N/A |  |

**Routing Rule**

Gateway 웹 서버는 `[/~BRANCH[@TAG]]/<ENDPOINT>`의 규칙대로 API 엔드포인트를 라우트합니다. 첫번째 경로 조각을 브랜치\(`master`를 기본값으로\)로 두번째 경로 조각을 태그\(`latest`를 기본값으로\)로 이하 경로를 API 엔드포인트로 해석합니다.

라우트 예시

| 간략 | 브랜치 포함 | 태그 포함 |
| :--- | :--- | :--- |
| GET /players/1 | GET /~master/players/1 | GET /~master@latest/players/1 |
| - | - | GET /~master@h4g3f2e1/players/1 |
| - | GET /~dongwook/players/1 | GET /~dongwook@latest/players/1 |
| - | - | GET /~dongwook@a4b3c2d1/players/1 |
| POST /graphql | POST /~master/graphql | GET /~master@latest/graphql |
| - | POST /~dongwook/graphql | GET /~dongwook@latest/graphql |
| - | GET /~ws-dev/chat | GET /~ws-dev@latest/chat |

테이블의 각 행은 동일한 버전의 핸들러로 연결됩니다.

브랜치 이름 규칙

* 영문 소문자 및 숫자, `-`, `_`만 허용됩니다.
* 기존 스키마 엔드포인트나 플러그인의 base 경로와 중복될 수 없습니다.

태그 이름 규칙

* 영문 소문자 및 숫자로만 구성됩니다.

#### B. API Handler

**Dynamic Handler**

동적 핸들러는 웹 서버의 모든 base 경로를 관리하며, 미들웨어 및 플러그인, 엔드포인트 간의 경로 충돌을 방지합니다. 동적 핸들러는 조건에 따라 브랜치 핸들러 및 버전 핸들러를 생성 및 삭제하며 동적으로 라우트 테이블을 구성합니다.

동적 핸들러는 클라이언트의 요청에 따라 미들웨어를 수행하고, 브랜치 핸들러로 요청을 프록시합니다.

**Branch Handler**

브랜치 핸들러는 태그에 따라 버전 핸들러로 요청을 프록시합니다.

이 브랜치 핸들러들은 아래의 규칙에 따라 삭제됩니다.

* `master` 브랜치를 제외하고, 60분 이상 실행되지 않는 브랜치 핸들러는 삭제됩니다.

**Version Handler**

서비스 API 스키마의 병합이 일어날 때마다 새로운 버전의 Gateway API 스키마가 생성됩니다. 병합에 성공한 Gateway API 스키마는 `latest` 및 숏해시로 태그됩니다. 그리고 업데이트된 엔드포인트별로 스키마, 프로토콜 플러그인, 커넥터를 연결해 각 핸들러를 생성합니다. 업데이트되지 않은 스키마의 핸들러는 가능한 재참조됩니다.

이 버전 핸들러들은 아래의 규칙에 따라 삭제됩니다.

* 10개를 초과\(기본값\)하는 버전이 존재한는 경우 오래된 순으로 버전 핸들러가 삭제됩니다. 

**Non-Persistence**

API 스키마의 브랜치 및 태그 기능은 버전 관리\(/v1, /v2 같은\)가 아닌 분산 환경에서의 개발 편의를 위해 개발되었습니다.

주의사항

* Gateway에는 Persistence Layer가 존재하지 않습니다.
* Gateway 재시작시 브랜치, 버전 및 태그 정보가 복원되지 않습니다.
* Gateway 노드간에 데이터 동기화 전략이 존재하지 않습니다.
* Gateway 노드간에 서비스 API 스키마 병합의 순서가 동일하게 보장되지 않습니다.

하지만 Gateway 재시작 이후 모든 서비스들에 대한 `discover`가 진행되면서 자연스럽게 각 브랜치의 `latest` 버전에는 최신 Gateway API 스키마가 복원됩니다. 각 브랜치의 `latest` 버전의 신뢰성은 보장됩니다.

**Load-Balancing**

동적으로 스키마를 수집하고 API를 업데이트하는 Gateway는 동일한 서비스 인스턴스가 분산 시스템에 여러개 존재할 때 문제를 드러냅니다.

예시

* `player` 서비스가 A, B 두 호스트에서 분산 시스템에 연결되어 디버깅되고 있다면, Gateway는 `player` 서비스 API 스키마를 A 호스트의 스키마, B 호스트의 스키마에 따라 빈번하게 변경하게 되어 원격지의 두 개발자는 디버깅에 문제를 겪습니다.
  * 해결 방법은 로컬에 전용 게이트웨이를 직접 실행하고 분산 시스템과의 연결\(eg. VPN 터널\)을 종료하는 방법입니다.
* `player` 서비스의 `get` 액션의 파라미터 및 응답 스펙이 A 호스트에서 디버깅 중인 경우, 클라이언트의 요청이 분산 시스템에 기존에 배포된 X 노드의 `player` 서비스의 `get` 액션으로 프록시되는 경우도 역시 문제가 됩니다.
  * 해결 방법으로 로드밸런싱의 우선 순위를 자신의 호스트로 강제하는 기능을 요청시 클라이언트 IP나 파라미터를 이용해 구현하는 방법이 있습니다. 이 방법은 이전 버전의 Gateway에서 시도되었으나 만족스럽지 않았습니다.
  * 또는 마찬가지로 로컬에 개발용 게이트웨이를 직접 실행하는 방법이지만, 분산 시스템에 연결해 배포된 타 서비스에 의존 할 필요가 있는 경우 불가능합니다.

위의 여러 전략을 실험해본 후 Gateway는 브랜치 및 태그을 통해 개발시 충돌 회피를 지원하고, 추가로 브랜치별 로드밸런싱 정책을 적용합니다.

* `call`
  * `master` 브랜치에서는 API 엔드포인트에 연결된 서비스 액션을 호출 할 때 `master`,`(none)` 브랜치에 API를 제공한 서비스 노드를 우선으로 요청을 프록시합니다.
    * 즉 이외\(eg. `dev`\)의 브랜치로의 트래픽을 방지합니다.
  * 이외의 브랜치\(eg. `dev`\)에서는 API 엔드포인트에 연결된 서비스 액션을 호출 할 때 `dev`,`master`,`(none)` 브랜치에 API를 제공한 서비스 노드를 우선으로 요청을 프록시합니다.
    * 즉 현재 브랜치\(eg. `dev`\)에 엔드포인트가 없는 경우 `master` 브랜치의 엔드포인트를 차선으로 찾습니다.
  * 이 규칙은 API 핸들러 생성시에 브랜치 전략에 따라 자연스럽게 적용됩니다.
* `publish`, `subscribe`
  * 이벤트 메시지 전달에는 서비스 브로커에 연결된 중앙 메시징 서비스의 정책을 그대로 따릅니다.

#### C. Reflection

**API Gateway Health Check**

Gateway 웹서버 자체의 상태 확인용 HTTP 엔드포인트를 내장하고 있습니다. 로드밸런서나 Kubernetes 등의 컨테이너 오케스트레이션 환경에서 활용 할 수 있습니다.

* `GET /~health/liveness` 엔드포인트에서 웹 서버의 상태를 확인 할 수 있습니다.
* `GET /~health/readiness` 엔드포인트에서 요청 처리가 가능한지 확인 할 수 있습니다.

Gateway 상태에 따른 각 엔드포인트의 HTTP 상태 코드는 다음과 같습니다.

| Gateway 상태 | 시작중 | 병합중 | 작동중 | 종료중 | 오류 |
| :--- | :--- | :--- | :--- | :--- | :--- |
| GET /~health/liveness | 200 | 200 | 200 | 200 | 500 |
| GET /~health/readiness | 503 | 200 | 200 | 503 | 500 |

**API Endpoint Health Check**

Gateway API 스키마의 각 엔드포인트 별 상태 확인 기능을 내장하고 있습니다. 엔드포인트에 연결된 커넥터를 기반으로 상태가 측정됩니다. 대부분의 커넥터의 상태 확인은 서비스 브로커에게 위임됩니다. 자세한 사항은 아래의 [Connector](docs.md#1-connector) 섹션을 참조 할 수 있습니다.

API 엔드포인트의 상태는 위처럼 HTTP로 제공되지 않으며 아래의 API Catalog를 통해서 제공됩니다.

**API Catalog**

API Catalog는 REST, GraphQL, WebSocket 등의 Protocol Plugin에 따라 각 엔드포인트에 대한 문서 정보를 제공하는 기능입니다. API Catalog 기능을 활성화하면 접근 제어 정책이 활성화되지 않은 `API` 타입이 GraphQL 스키마에 통합됩니다. 접근 제어 정책은 활성화시 옵션으로 주입 할 수 있습니다.

**Service Catalog**

Service Catalog는 분산 시스템의 서비스들의 각 엔드포인트에 대한 정보를 제공하는 기능입니다. Service Catalog 기능을 활성화하면 접근 제어 정책이 활성화되지 않은 `Service` 타입이 GraphQL 스키마에 통합됩니다. 접근 제어 정책은 활성화시 옵션으로 주입 할 수 있습니다.

## Request Lifecycle

#### 1. Extension

Server Extension은 웹 서버를 생성 및 확장하는데 쓰입니다. 서버 생성 옵션을 통해 제어 할 수 있습니다.

**HTTP**

HTTP Extension은 HTTP 프로토콜을 지원하도록 웹 서버를 생성합니다. 기본적으로 활성화됩니다.

**HTTP/2**

HTTP/2 Extension은 HTTP/2 프로토콜을 지원하도록 웹 서버를 생성합니다.

**TLS**

TLS Extension은 HTTPS 요청을 처리 할 수 있도록 웹 서버를 생성합니다.

### 2. Middleware

엔드포인트로의 라우팅 전/후에 미들웨어들이 실행됩니다. 서버 생성 옵션을 통해 제어 할 수 있습니다.

#### A. Before Middleware

엔드포인트로의 라우팅 전에 수행되는 미들웨어입니다.

**Static**

Static Middleware는 최초로 수행되는 미들웨어입니다. 활성화시 API Gateway 서비스 노드의 특정 디렉토리에서 애셋 파일들을 서빙합니다.

**Body Parser**

Body Parser는 `application/json`, `application/x-www-form-url-encoded`, `multipart/form-data` Content Type 요청의 바디를 JavaScript 객체로 해석합니다.

**Cookie Parser**

Cookie Parser는 Cookie 헤더를 JavaScript 객체로 해석하고 검증합니다.

**CORS**

CORS 미들웨어는 교차 출처 자원 공유에 대한 접근 제어 정책에 따라 Preflight 요청에 응답합니다.

**Helmet**

Helmet 미들웨어는 서버에 CSP, HSTS 등 기초적인 보안 요소를 추가합니다.

#### B. Context Factory

엔드포인트로의 라우팅 직전에 Context Factory 미들웨어를 통해 요청 컨텍스트를 생성하게 됩니다. Context는 API Handler에 전달되는 인증, Locale, Language, TimeZone 등의 정보를 포함한 객체입니다.

**Locale**

Locale 컨텍스트는 요청 헤더로부터 Locale, Language, TimeZone 등의 정보를 추출합니다.

**Auth**

인증 컨텍스트를 활성화하기 위해서는 요청으로부터 서버 생성 옵션을 통해 인증 정보를 생성하는 함수를 구현해야합니다. 예를 들어 Bearer 토큰을 [moleculer-iam](https://github.com/qmit-pro/moleculer-iam) 피어 모듈을 통해 통해 파싱해 idToken을 획득하거나, 별도의 인증 서버에 전달해 원하는 방식대로 해석 할 수 있습니다.

#### C. After Middleware

엔드포인트로에서의 응답 후에 수행되는 미들웨어입니다.

**Error**

Error 미들웨어는 분산 서비스의 에러를 파악하고 HTTP 상태 코드를 설정하며 표준화된 에러 포맷의 응답을 생성합니다.

**ETag**

ETag 미들웨어는 GET, HEAD 요청 및 응답\(200 OK\)에서 If-None-Match 및 ETag 헤더를 활용해 API 클라이언트의 성능을 높힙니다.

**Header**

Header 미들웨어는 Header Context에 값이 할당된 경우 응답 헤더를 업데이트합니다.

### 3. API Handler

요청이 전처리 미들웨어, 컨텍스트 미들웨어를 통과 한 후에 동적으로 생성된 엔드포인트로 라우팅됩니다. API 핸들러를 통과 한 후 후처리 미들웨어를 지나 요청이 완료됩니다.

#### A. Dynamic Handler

동적 핸들러는 Gateway에 생성된 브랜치에 따라 요청을 브랜치 핸들러로 프록시합니다.

#### B. Branch Handler

브랜치 핸들러는 Gateway에 생성된 해당 브랜치의 태그에 따라 요청을 버전 핸들러로 프록시합니다.

#### C. Version Handler

버전 핸들러는 Gateway API 스키마에 따라 커넥터 및 프로토콜 플러그인을 조합해 생성한 핸들러로 요청을 프록시합니다.

## Plugin

플러그인은 서비스 API 스키마의 포맷과 기능을 확장하는데 쓰입니다. 플러그인은 위임된 스키마에 대한 검증, 해석, 작동 방식을 정의하고 구현합니다.

각 프로토콜 플러그인은 해당 프로토콜 스키마의 양식을 정의하고, 스키마 병합, 요청 프록시, 의존성 파악, 서버 확장 핸들러 등을 구현합니다.

각 접근 제어 플러그인은 해당 접근 제어 스키마의 양식을 정의하고, `call`, `publish`, `subscribe` 커넥터의 정책을 해석하고 접근 제어를 판단하는 핸들러를 구현합니다.

### 1. Protocol

프토토콜 플러그인별 스키마 양식은 [API Schema](docs.md#1-api-schema) 섹션을 참조하십시오. 이 섹션에서는 기본 플러그인의 구동 방식을 개괄적으로 설명합니다.

#### A. REST

REST 프로토콜은 분산 서비스에 대한 `call`, `publish` 커넥터를 특정 엔드포인트에 맵핑합니다. HTTP 요청의 Paylo,ad는 미들웨어를 통해 파싱되어 `params` 커넥터를 통해 변환되어 `call`, `publish` 커넥터로 전달됩니다.

엔드포인트가 중복되는 경우 병합을 발생시킨 출처 노드로 디버그 메세지가 `report`되며 병합에 실패합니다.

API Catalog를 통해서 엔드포인트 별 적용된 정책 및 커넥터와 그 파라미터에 대한 설명을 제공합니다.

TODO: $headers, $status, $body field for REST response

#### B. GraphQL

GraphQL 프로토콜은 분산 서비스에 대한 `call` 및 `publish`, `subscribe` 커넥터를 특정 타입의 필드에 맵핑합니다. HTTP 요청의 Payload는 미들웨어를 통해 파싱되어 `params` 커넥터를 통해 변환되어 `call`, `publish`, `subscribe`, `map` 커넥터로 전달됩니다.

GraphQL 스키마 생성에 실패하는 경우 병합을 발생시킨 출처 노드로 디버그 메세지가 `report`되며 병합에 실패합니다.

API Catalog를 통해서 각 GraphQL Type 별 적용된 정책 및 커넥터와 그 파라미터에 대한 설명을 제공합니다.

서비스 API 스키마를 통해서 GraphQL Custom Scalar 정의를 추가 할 수 없습니다. Gateway 생성시 플러그인 옵션을 통해 Scalar 정의를 추가하거나 오버라이드 할 수 있습니다. 기본적으로 `DateTime`, `Date`, `Time`, `JSON`가 포함되어있습니다.

#### C. WebSocket

TODO: WIP

### 2. Access Control Policy

접근 제어 플러그인별 스키마 양식은 [Access Control Policy](docs.md#d-access-control-policy) 섹션을 참조하십시오. 이 섹션에서는 기본 플러그인의 구동 방식을 개괄적으로 설명합니다.

프로토콜의 확장성과 접근제어 정책의 정합성을 위해서, 접근 제어 정책은 프로토콜별 엔드포인트가 아니라 액션과 이벤트를 주체로 적용됩니다.

접근 제어 정책의 평가는 API Gateway의 메모리에 LRU 방식으로 캐시되며 한 요청에서 중복 수행되지 않습니다. 캐시 키를 생성 할 때 요청을 정확히 구분하기 위해서 컨텍스트\(인증 정보\) 및 호출 페이로드 등의 정보가 반영됩니다.

적용되는 플러그인의 순서는 유효합니다. 우선하는 플러그인에서 실패 할 경우 다음 플러그인의 정책은 평가되지 않습니다. 접근 제어 플러그인의 기본 옵션에서 OAuth2 Scope 플러그인\(`scopes`\)이 FBAC 플러그인\(`filter`\)보다 우선합니다.

#### A. OAuth2 Scope

OAuth2 Scope 플러그인은 각 정책의 `scopes`에 나열된 스코프를 `context.scopes`가 하나 이상의 스코프를 포함하는 경우 접근을 허용합니다.

#### B. FBAC

FBAC 플러그인은 각 정책의 `filter` 항목에 맵핑된 Inline JavaScript Function String을 VM에서 실행하고 그 `Boolean` 값으로 접근 제어 여부를 판단합니다. 평가중 에러가 발생하거나 `Boolean` 값이 리턴되지 않는 경우, API Gateway에서 출처 노드로 전달되며 접근이 거부됩니다.

디버깅 중에 Inline JavaScript Function String에서 `console` 객체를 사용해 메세지를 출력하는 경우, 그 메세지는 `console` 객체에 바인딩된 `report` 커넥터가 출처 노드로 전달합니다.

## Service Broker

서비스 브로커는 분산 서비스들의 네트워킹을 위임 받으며, `call`, `publish`, `subscribe`, `discover`, `report` 등의 주요 네트워킹 인터페이스\(커넥터\)를 가진 어댑터와 결합됩니다.

### 1. Connectors

#### A. Context Connectors

요청 상태를 기반으로 API 요청에 활용되는 커넥터입니다. 접근 제어 및 stateless 커넥터를 연계 할 수 있습니다.

| 커넥터 | 어댑터에 위임 | 연결 가능한 커넥터 | 개요 |
| :--- | :--- | :--- | :--- |
| call | O | `params`, `map` | 분산 서비스 액션을 호출합니다. |
| publish | O | `params` | 중앙 메시징 서비스에 이벤트를 발행합니다. |
| subscribe | O | `map` | 중앙 메시징 서비스에서 이벤트를 구독합니다. |

GraphQL의 `Subscription` 타입이나 WebSocket 프로토콜 등을 사용하지 않거나, 분산 시스템에 중앙 메시징 서비스를 제공 할 수 없는 경우엔 `publish`, `subscribe` 커넥터를 구현하지 않아도 무관합니다.

#### B. Stateless Connectors

요청 상태가 없는 커넥터입니다.

| 커넥터 | 어댑터에 위임 | 개요 |
| :--- | :--- | :--- |
| map | X | Inline JavaScript Function String을 VM에서 해석하여 주어진 객체나 응답 객체를 변환합니다. |
| params | X | 요청 페이로드에서 위의 타 커넥터들로 전달 할 객체를 생성합니다. |
| discover | O | 분산 서비스의 업데이트나 종료를 감지하고, 노드, 서비스 API Schema, 액션 및 이벤트 구독, 발행 정보를 수집합니다. |
| health | O | 분산 서비스 및 액션, 중앙 메시징 서비스의 상태 확인을 제공합니다. |
| reporter | O | 출처 노드로 디버그 메세지를 전달합니다. |
| logger | O | Gateway의 로깅 인스턴스를 제공합니다. |

### 2. Adaptors

브로커는 위 커넥터들의 특정 인터페이스를 구현하는 단일한 객체로 구현됩니다.

#### A. Moleculer

* `MoleculerAPIGateway` 서비스를 minxin에 포함해 `moleculer.ServiceSchema`를 확장 할 수 있습니다.
* `MoleculerServiceBroker`를 이용해 직접 `moleculer.ServiceSchema`를 구현 할 수 있습니다.

#### B. Others

기타 MSA 라이브러리를 응용해 `ServiceBroker` 인터페이스를 구현 할 수 있습니다.

## Examples

예시 코드는 [../src/examples](https://github.com/qmit-pro/moleculer-api/tree/cefe0af7e315fc0fee5de008b7c387da5a55046b/src/examples/README.md)를 참고 할 수 있습니다.


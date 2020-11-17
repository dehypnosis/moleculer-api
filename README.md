---
description: >-
  A dynamic API Gateway which updates REST endpoints, GraphQL schema, WebSocket
  handlers and access control policies by integrating metadata of discovered
  remote services.
---

# moleculer-api

[![Build Status](https://travis-ci.org/qmit-pro/moleculer-api.svg?branch=master)](https://travis-ci.org/qmit-pro/moleculer-api) [![Coverage Status](https://coveralls.io/repos/github/qmit-pro/moleculer-api/badge.svg?branch=master)](https://coveralls.io/github/qmit-pro/moleculer-api?branch=master) [![David](https://img.shields.io/david/qmit-pro/moleculer-api.svg)](https://david-dm.org/qmit-pro/moleculer-api) [![Known Vulnerabilities](https://snyk.io/test/github/qmit-pro/moleculer-api/badge.svg)](https://snyk.io/test/github/qmit-pro/moleculer-api) [![NPM version](https://img.shields.io/npm/v/moleculer-api.svg)](https://www.npmjs.com/package/moleculer-api) [![Moleculer](https://badgen.net/badge/Powered%20by/Moleculer/0e83cd)](https://moleculer.services)

**moleculer-api**는 MSA 환경에서 마이크로 서비스들의  API 스키마 조각을 수집하고, 무중단으로 통합 API를 업데이트하여 제공하는 웹 서버 컴포넌트입니다.

서비스 API 스키마는 분산 서비스 프로시저의 호출, 또는 중앙 메시징 서비스에 대한 이벤트 발행 및 구독을 응용 프로토콜\(REST, GraphQL, WebSocket 등\)에 맵핑합니다. 서비스 API 스키마는 JSON 포맷으로 구성되어있으며, 응용 프로토콜 별 API 맵핑과 그에 대한 접근 제어로 구성되어 있습니다.

### 서비스 API 스키마 예시

{% tabs %}
{% tab title="Storage REST API" %}
```typescript
{
  branch: "master",
  policy: {},
  protocol: {
    REST: {
      basePath: "/storage",
      routes: [
        {
          path: "/",
          method: "GET",
          call: {
            action: "storage.get",
            params: {
              offset: "@query.offset:number",
              limit: "@query.limit:number",
            },
          },
        },
        {
          path: "/upload",
          method: "POST",
          call: {
            action: "storage.create",
            params: {
              file: "@body.file",
              meta: {
                tags: {
                  identityId: "@context.auth.identity.sub",
                },
                allowedContentTypes: ["text/*", "image/*", "application/pdf"],
                private: false,
              },
            },
          },
        },
        {
          path: "/upload-stream",
          method: "POST",
          description: "not a production purpose, need a wrapper action to make this safe",
          call: {
            action: "storage.createWithStream",
            params: "@body.file",
            implicitParams: false,
          },
        },
        {
          path: "/download/:id",
          method: "GET",
          call: {
            action: "storage.getURL",
            params: {
              id: "@path.id",
              expiryHours: "@query.expiryHours:number",
              prompt: "@query.prompt:boolean",
              promptAs: "@query.promptAs:string",
            },
            map: `({ response }) => ({
              $status: response ? 303 : 404,
              $headers: response ? { "Location":  response } : undefined,
            })`,
          },
        },
        {
          path: "/:id",
          method: "GET",
          call: {
            action: "storage.find",
            params: {
              id: "@path.id",
            },
            map: `({ response }) => ({
              $status: response ? 200 : 404,
              $body: response,
            })`,
          },
        },
        {
          path: "/:id",
          method: "PUT",
          call: {
            action: "storage.update",
            params: {
              id: "@path.id",
              // id, name, tags, private, contentType
            },
          },
        },
        {
          path: "/:id",
          method: "DELETE",
          call: {
            action: "storage.delete",
            params: {
              id: "@path.id",
            },
          },
        },
      ],
    },
  },
}
```
{% endtab %}

{% tab title="Storage GraphQL API" %}
```typescript
{
  branch: "master",
  policy: {},
  protocol: {
    GraphQL: {
      typeDefs: `
        extend type Query {
          storage: StorageQuery!
        }
    
        type StorageQuery {
          files(offset: Int = 0, limit: Int = 10): FileList!
          file(id: ID!): File
        }
    
        type File {
          id: ID!
          name: String!
          contentType: String!
          tags: JSON!
          private: Boolean!
          byteSize: Int!
          size: String!
          url(expiryHours: Int = 2, prompt: Boolean = false, promptAs: String): String!
          updatedAt: DateTime!
          createdAt: DateTime!
        }
    
        type FileList {
          offset: Int!
          limit: Int!
    
          # it is not exact value
          total: Int!
          entries: [File!]!
          hasNext: Boolean!
          hasPrev: Boolean!
        }
    
        extend type Mutation {
          storage: StorageMutation!
        }
    
        type StorageMutation {
          upload(file: Upload!): File!
          update(id: ID!, name: String, tags: JSON, private: Boolean): File!
          delete(id: ID!): Boolean!
        }
      `,
      resolvers: {
        Query: {
          storage: `() => ({})`,
        },
        Mutation: {
          storage: `() => ({})`,
        },
        StorageMutation: {
          upload: {
            call: {
              action: "storage.create",
              params: {
                file: "@args.file",
                meta: {
                  allowedContentTypes: [],
                  private: false,
                },
              },
            },
          },
          update: {
            call: {
              action: "storage.update",
              params: {},
            },
          },
          delete: {
            call: {
              action: "storage.delete",
              params: {},
            }
          },
        },
        StorageQuery: {
          file: {
            call: {
              action: "storage.find",
              params: {
                id: "@args.id[]",
              },
            },
          },
          files: {
            call: {
              action: "storage.get",
              params: {
                offset: "@args.offset",
                limit: "@args.limit",
              },
            },
          },
        },
        File: {
          url: {
            call: {
              action: "storage.getURL",
              params: {
                id: "@source.id[]",
                expiryHours: "@args.expiryHours",
                prompt: "@args.prompt",
                promptAs: "@args.promptAs",
              },
            },
          },
          size: (({ source }: any) => {
            const { byteSize = 0 } = source;
            const boundary = 1000;
            if (byteSize < boundary) {
              return `${byteSize} B`;
            }
            let div = boundary;
            let exp = 0;
            for (let n = byteSize / boundary; n >= boundary; n /= boundary) {
              div *= boundary;
              exp++;
            }
            const size = byteSize / div;
            return `${isNaN(size) ? "-" : size.toLocaleString()} ${"KMGTPE"[exp]}B`;
          }).toString(),
        },
        FileList: {
          hasPrev: `({ source }) => source.offset > 0`,
        }
      },
    },
  },
}
```
{% endtab %}

{% tab title="User GraphQL API" %}
```typescript
{
  branch: "master",
  policy: {
    call: [
      {
        actions: ["user.update"],
        description: "A user can update the user profile which is belongs to own account.",
        scope: ["user.write"],
        filter: (({ context, params }) => {
          console.log(context);
          if (params.id) {
            return context.auth.identity.sub === params.id;
          }
          return false;
        }).toString(),
      },
    ],
  },
  protocol: {
    GraphQL: {
      typeDefs: `
        extend type Query {
          viewer: User
          user(id: Int, identityId: String, username: String, where: JSON): User
        }
  
        extend type Mutation {
          createUser(input: UserInput!): User!
          updateUser(input: UserInput!): User!
        }
  
        input SportsUserInput {
          id: Int
          username: String
          birthdate: Date
          gender: Gender
          name: String
          pictureFileId: String
        }
        
        type User {
          id: Int!
          username: String!
          name: String!
          birthdate: Date
          gender: Gender
          pictureFile: File
        }
      `,
      resolvers: {
        User: {
          pictureFile: {
            call: {
              if: "({ source }) => !!source.pictureFileId",
              action: "storage.find",
              params: {
                id: "@source.pictureFileId[]",
              },
            },
          },
        },
        Mutation: {
          createUser: {
            call: {
              action: "user.create",
              params: "@args.input",
              implicitParams: false,
            },
          },
          updateUser: {
            call: {
              action: "user.update",
              params: "@args.input",
              implicitParams: false,
            },
          },
        },
      },
    },
  },
}
```
{% endtab %}

{% tab title="Notification REST API" %}
```typescript
{
  branch: "master",
  policy: {},
  protocol: {
    REST: {
      description: "update user's FCM registration token",
      basePath: "/notification",
      routes: [
        {
          method: "PUT",
          path: "/update-token",
          call: {
            action: "notification.updateToken",
            params: {
              identityId: "@context.auth.identity.sub",
              token: "@body.token",
            },
          },
        },
      ],
    },
  },
}
```
{% endtab %}

{% tab title="Chat WebSocket API" %}
```javascript
{
  branch: "master",
  policy: {},
  protocol: {
    WebSocket: {
      basePath: "/chat",
      description: "...",
      routes: [
        /* bidirectional streaming chat */
        {
          path: "/message-stream/:roomId",
          call: {
            action: "chat.message.stream",
            params: {
              roomId: "@path.roomId",
            },
          },
        },
        /* pub/sub chat */
        {
          path: "/message-pubsub/:roomId",
          subscribe: {
            events: `({ path }) => ["chat.message." + path.roomId]`,
          },
          publish: {
            event: `({ path }) => "chat.message." + path.roomId`,
            params: "@message",
          },
        },
        /* pub/sub video */
        {
          path: "/video-pubsub",
          subscribe: {
            events: ["chat.video"],
          },
          publish: {
            event: "chat.video",
            params: {
              id: "@context.id",
              username: "@query.username",
              data: "@message",
            },
            filter: `({ params }) => params.id && params.username && params.data`,
          },
        },
        /* streaming video */
        {
          path: "/video-stream/:type",
          call: {
            action: "chat.video.stream",
            params: {
              id: "@context.id",
              type: "@path.type",
            },
          },
        },
      ],
    },
  },
}
```
{% endtab %}
{% endtabs %}

Gateway는 특정 서비스 API 스키마의 추가, 제거 및 업데이트시 기존 통합 API 스키마에 병합을 시도하고, 성공시 무중단으로 라우터를 업데이트하며 그 결과를 원격 서비스에 다시 보고합니다.

![Gateway&#xC758; &#xBB34;&#xC911;&#xB2E8; &#xC5D4;&#xB4DC;&#xD3EC;&#xC778;&#xD2B8; &#xC5C5;&#xB370;&#xC774;&#xD2B8; &#xBC0F; &#xBCF4;&#xACE0;](docs/.gitbook/assets/report.png)

### 주요 기능

* 분산 서비스의 API 스키마를 수집하고 병합하여 API를 실시간으로 업데이트
* Polyglot 하거나 서로 다른 서비스 브로커에 기반한 서비스들의 API 스키마를 수집하고 병합 할 수 있음
* 개발 편의 및 충돌 방지를 위한 API 브랜칭 및 버저닝 기능
* 상태 검사 및 API 문서 생성 \(WIP\)
* 미들웨어 방식의 요청 흐름 제어
  * Error
  * Logging
  * Body Parser
  * Helmet
  * CORS
  * Serve Static File
  * HTTP/HTTPS/HTTP2
  * \(확장 가능\)
* 미들웨어 방식의 컨텍스트 생성 제어
  * Authn/Authz
  * Locale
  * Correlation ID
  * IP Address
  * User-Agent
  * Request
  * \(확장 가능\)
* 응용 프로토콜 플러그인
  * REST
  * GraphQL
  * WebSocket
  * \(확장 가능\)
* 접근 제어 정책 플러그인
  * OAuth2 scope 기반 접근 제어
  * JavaScript [FBAC; Function Based Access Control](https://arxiv.org/abs/1609.04514) 기반 접근 제어
  * \(확장 가능\)

## License

The project is available under the [MIT license](https://tldrlegal.com/license/mit-license).


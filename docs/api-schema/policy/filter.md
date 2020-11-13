# Filter

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

위처럼 `filter`가 생략된 경우 `scopes`만 적용되며 `filter`는 통과한 것처럼 평가됩니다.

```javascript
{
  actions: ["**"],
  scopes: ["**"],
  filter: `() => true`,
}
```

접근제어 플러그인을 비활성화하는 것은  위 정책을 작성하는 것과 동일합니다.

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


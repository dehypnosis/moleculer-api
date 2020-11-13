# Scope

**Scopes**

```javascript
    call: [
      {
        description: "admin can remove player, newbie and admin can create player",
        actions: ["player.**"],
        scopes: ["player", "player.admin"],
```

위 정책은 `player.**` 패턴\(`player.get`, `player.list`, `player.message.list` 등과 일치\)의 액션을 호출하는 `call` 커넥터가 사용되는 모든 엔드포인트가 수행되기 전에 공통적으로 평가됩니다. 우선 `scopes` 접근 제어 플러그인에 따라 `context`에 주입된 \(`moleculer-iam` 같은 컨텍스트 플러그인을 통해\) OAuth 토큰이 획득한 스코프를 확인하고 일치되는 스코프가 하나라도 있는 경우 통과합니다.


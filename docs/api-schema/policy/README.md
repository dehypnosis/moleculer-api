# Policy Plugin

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

\*\*\*\*

**Caching: TODO**

또한 접근 제어 정책의 평가는 Gateway의 메모리에 LRU 방식으로 캐시되며 한 요청에서 중복 수행되지 않습니다. 캐시 키를 생성 할 때 요청을 정확히 구분하기 위해서 컨텍스트\(인증 정보\) 및 호출 페이로드 등의 정보가 반영됩니다.


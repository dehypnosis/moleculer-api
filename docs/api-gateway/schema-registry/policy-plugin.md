# Policy Plugin

### 2. Access Control Policy

접근 제어 플러그인별 스키마 양식은 [Access Control Policy](../api-gateway.md#d-access-control-policy) 섹션을 참조하십시오. 이 섹션에서는 기본 플러그인의 구동 방식을 개괄적으로 설명합니다.

프로토콜의 확장성과 접근제어 정책의 정합성을 위해서, 접근 제어 정책은 프로토콜별 엔드포인트가 아니라 액션과 이벤트를 주체로 적용됩니다.

접근 제어 정책의 평가는 API Gateway의 메모리에 LRU 방식으로 캐시되며 한 요청에서 중복 수행되지 않습니다. 캐시 키를 생성 할 때 요청을 정확히 구분하기 위해서 컨텍스트\(인증 정보\) 및 호출 페이로드 등의 정보가 반영됩니다.

적용되는 플러그인의 순서는 유효합니다. 우선하는 플러그인에서 실패 할 경우 다음 플러그인의 정책은 평가되지 않습니다. 접근 제어 플러그인의 기본 옵션에서 OAuth2 Scope 플러그인\(`scopes`\)이 FBAC 플러그인\(`filter`\)보다 우선합니다.

#### A. OAuth2 Scope

OAuth2 Scope 플러그인은 각 정책의 `scopes`에 나열된 스코프를 `context.scopes`가 하나 이상의 스코프를 포함하는 경우 접근을 허용합니다.

#### B. FBAC

FBAC 플러그인은 각 정책의 `filter` 항목에 맵핑된 Inline JavaScript Function String을 VM에서 실행하고 그 `Boolean` 값으로 접근 제어 여부를 판단합니다. 평가중 에러가 발생하거나 `Boolean` 값이 리턴되지 않는 경우, API Gateway에서 출처 노드로 전달되며 접근이 거부됩니다.

디버깅 중에 Inline JavaScript Function String에서 `console` 객체를 사용해 메세지를 출력하는 경우, 그 메세지는 `console` 객체에 바인딩된 `report` 커넥터가 출처 노드로 전달합니다.


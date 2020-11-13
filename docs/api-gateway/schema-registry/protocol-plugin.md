# Protocol Plugin

## Plugin

플러그인은 서비스 API 스키마의 포맷과 기능을 확장하는데 쓰입니다. 플러그인은 위임된 스키마에 대한 검증, 해석, 작동 방식을 정의하고 구현합니다.

각 프로토콜 플러그인은 해당 프로토콜 스키마의 양식을 정의하고, 스키마 병합, 요청 프록시, 의존성 파악, 서버 확장 핸들러 등을 구현합니다.

각 접근 제어 플러그인은 해당 접근 제어 스키마의 양식을 정의하고, `call`, `publish`, `subscribe` 커넥터의 정책을 해석하고 접근 제어를 판단하는 핸들러를 구현합니다.

### 1. Protocol Plugin

프토토콜 플러그인별 스키마 양식은 [API Schema](../api-gateway.md#1-api-schema) 섹션을 참조하십시오. 이 섹션에서는 기본 플러그인의 구동 방식을 개괄적으로 설명합니다.

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



### 


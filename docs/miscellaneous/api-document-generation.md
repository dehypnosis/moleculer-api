# API Document Generation

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

Gateway API 스키마의 각 엔드포인트 별 상태 확인 기능을 내장하고 있습니다. 엔드포인트에 연결된 커넥터를 기반으로 상태가 측정됩니다. 대부분의 커넥터의 상태 확인은 서비스 브로커에게 위임됩니다. 자세한 사항은 아래의 [Connector](../api-gateway/api-gateway.md#1-connector) 섹션을 참조 할 수 있습니다.

API 엔드포인트의 상태는 위처럼 HTTP로 제공되지 않으며 아래의 API Catalog를 통해서 제공됩니다.

**API Catalog**

API Catalog는 REST, GraphQL, WebSocket 등의 Protocol Plugin에 따라 각 엔드포인트에 대한 문서 정보를 제공하는 기능입니다. API Catalog 기능을 활성화하면 접근 제어 정책이 활성화되지 않은 `API` 타입이 GraphQL 스키마에 통합됩니다. 접근 제어 정책은 활성화시 옵션으로 주입 할 수 있습니다.

**Service Catalog**

Service Catalog는 분산 시스템의 서비스들의 각 엔드포인트에 대한 정보를 제공하는 기능입니다. Service Catalog 기능을 활성화하면 접근 제어 정책이 활성화되지 않은 `Service` 타입이 GraphQL 스키마에 통합됩니다. 접근 제어 정책은 활성화시 옵션으로 주입 할 수 있습니다.


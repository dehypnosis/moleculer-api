# Connenctor

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

### 


# Service Broker

### Service Brokers

API Gateway는 최초에 [Moleculer](https://moleculer.services) MSA 라이브러리를 배경으로 개발되었지만, 확장성을 위해서 강한 디커플링을 방침으로 개발되고 있습니다.

API Gateway는 분산 서비스 및 중앙 메시징 서비스와의 네트워킹을 서비스 브로커에게 위임합니다. 서비스 브로커는 분산 서비스들의 네트워킹을 위임 받으며, `call`, `publish`, `subscribe`, `discover`, `report` 등의 주요 네트워킹 인터페이스\(커넥터\)를 가진 어댑터와 결합됩니다.



Service Broker

서비스 브로커는 분산 서비스들의 네트워킹을 위임 받으며, `call`, `publish`, `subscribe`, `discover`, `report` 등의 주요 네트워킹 인터페이스\(커넥터\)를 가진 어댑터와 결합됩니다.

### 2. Delegator

브로커는 위 커넥터들의 특정 인터페이스를 구현하는 단일한 객체로 구현됩니다.

#### A. Moleculer

* `MoleculerAPIGateway` 서비스를 minxin에 포함해 `moleculer.ServiceSchema`를 확장 할 수 있습니다.
* `MoleculerServiceBroker`를 이용해 직접 `moleculer.ServiceSchema`를 구현 할 수 있습니다.

#### B. Others

기타 MSA 라이브러리를 응용해 `ServiceBroker` 인터페이스를 구현 할 수 있습니다.

#### 


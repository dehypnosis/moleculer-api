# Schema Registry



#### A. Schema Integration

서비스 API 스키마는 서비스 브로커에 의존해 Gateway로 수집되고 처리됩니다. Moleculer 어댑터로 작성된 서비스 브로커의 경우 기본적으로 `ServiceSchema`의 `metadata.api` 필드에서 서비스 API 스키마가 수집되기를 기대합니다.

서비스 API 스키마의 병합은 서비스 노드의 연결, 종료, 스키마 변경시 발생합니다. 서비스 API 스키마는 자신의 스키마를 병합 할 브랜치를 스키마에 명시합니다. Gateway에는 기본적으로 `master` 브랜치가 생성되어있으며, `master` 브랜치는 제거 될 수 없습니다.

\*\*\*\*

\*\*\*\*


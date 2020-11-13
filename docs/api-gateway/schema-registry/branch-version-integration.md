# Branch, Version, Integration



**Integration Process**

병합 규칙은 다음과 같습니다.

* discover
  * `discover` 발생 즉시 병합 요청이 생성됩니다.
  * 프로토콜 플러그인을 따라 스키마 포맷에 대한 검증을 거칩니다.
    * 포맷 에러는 병합 요청 메세지 리스트에 포함됩니다.
    * 접근 제어를 우회하는 엔드포인트에 대한 경고가 병합 요청 메세지 리스트에 포합됩니다.
  * 검증 성공시 병합 요청이 큐에 삽입되면서 특정 시간\(2초를 기본값\) 동안 debounce 후 순차적으로 처리됩니다.
    * 큐에서 특정 서비스에 대한 병합 요청이 다수인 경우 마지막 요소만 유효합니다.
    * 프로토콜 플러그인에서 `integrationDependencyResolver`가 구현된 경우 \(eg. GraphQL\) 큐 안에서 처리 순서가 조정 될 수 있습니다.
  * 검증 실패시 `report` 단계로 건너 뜁니다.
* hash
  * 서비스 API 스키마에서 `branch`, `description`, `deprecated`등의 메타 정보를 제외한 스키마 객체 전체를 MD5 해싱하여 고유한 버전 해시를 생성합니다.
  * 게이트웨이에 버전이 존재하지 않는 경우에는 스키마를 업데이트하기로 합니다.
  * 서비스 노드의 연결이 끊긴 경우는 연관된 스키마의 노드풀에서 노드를 삭제합니다.
    * 이 때 연관된 스키마들에서 노드풀이 빈 스키마들을 제거하기로 합니다.
* update
  * `master` 브랜치의 스키마는 경우에는 모든 브랜치에 병합이 시도됩니다.
    * 이 때 `master` 외의 브랜치에서 스키마의 서비스명이 중복되는 경우 병합하지 않습니다. 기존 스키마의 우선 순위가 높습니다.
  * 이외의 브랜치에 병합하는 경우에는 주어진 브랜치에만 병합이 시도됩니다.
  * 프로토콜 플러그인을 따라 각 프로토콜별 핸들러를 생성합니다.
    * 병합에 성공하면 생성된 Gateway API 스키마 버전에 `latest` 태그 및 8 글자의 숏 해시\(eg. `abcdefgh`\)가 태그로 부착됩니다.
  * 옵션이 활성화된 경우 브랜치별 API Catalog를 업데이트합니다.
  * 옵션이 활성화된 경우 브랜치별 Service Catalog를 업데이트합니다.
* report
  * 병합 요청의 메세지 리스트를 기반으로 디버그 메세지를 생성합니다.
  * 병합 요청의 출처 노드로 디버그 메세지를 `report`합니다.
*   **Branch Strategy Diagram**

  브랜치간 병합 전략을 표로 도식하면 다음과 같습니다.

  표에서 `a@v1`는 `a` 서비스 스키마 중 `v1` 버전을 의미합니다.

  | 이벤트/브랜치 | master | dongwook | 비고 |
  | :--- | :--- | :--- | :--- |
  | initial schema | `(empty)` | N/A |  |
  | `a` added to `master` | `a@v1` | N/A |  |
  | `a` updated to `master` | `a@v2` | N/A |  |
  | `b` added to `dongwook` | `a@v2` | `a@v2` `b@v1` | 새로운 `b` 서비스를 `dongwook` 브랜치로 분기해서 작업; 충돌하지 않는 스키마들은 복제되지 않고 참조됩니다. |
  | `a` updated to `master` | `a@v3` | `a@v3` `b@v1` | `master` 브랜치의 업데이트는 모든 브랜치로 전파됩니다. |
  | `a` updated to `dongwook` | `a@v3` | `a@v4` `b@v1` | `master` 이외의 브랜치의 업데이트는 자기 브랜치로만 전파됩니다. |
  | `a` updated to `master` | `a@v3-2` | `a@v4` `b@v1` | 충돌하는 경우 자기 브랜치 스키마의 우선 순위가 높습니다. |
  | `c` added to `master` | `a@v3-2` `c@v1` | `a@v5` `b@v1` `c@v1` | `master` 브랜치의 업데이트는 모든 브랜치로 전파됩니다. |
  | `b` added to `master` | `a@v3-2` `b@v1` `c@v1` | `a@v5` `b@v1` `c@v1` | 개발된 `b` 서비스를 `dongwook` 브랜치에서 `master` 브랜치로 변경 |
  | `a` updated to `master` | `a@v5` `b@v1` `c@v1` | `a@v5` `b@v1` `c@v1` | 수정된 `a` 서비스를 `dongwook` 브랜치에서 `master` 브랜치로 변경 |
  | `dongwook` branch removed | `a@v5` `b@v1` `c@v1` | N/A |  |

  **Routing Rule**

  Gateway 웹 서버는 `[/~BRANCH[@TAG]]/<ENDPOINT>`의 규칙대로 API 엔드포인트를 라우트합니다. 첫번째 경로 조각을 브랜치\(`master`를 기본값으로\)로 두번째 경로 조각을 태그\(`latest`를 기본값으로\)로 이하 경로를 API 엔드포인트로 해석합니다.

  라우트 예시

  | 간략 | 브랜치 포함 | 태그 포함 |
  | :--- | :--- | :--- |
  | GET /players/1 | GET /~master/players/1 | GET /~master@latest/players/1 |
  | - | - | GET /~master@h4g3f2e1/players/1 |
  | - | GET /~dongwook/players/1 | GET /~dongwook@latest/players/1 |
  | - | - | GET /~dongwook@a4b3c2d1/players/1 |
  | POST /graphql | POST /~master/graphql | GET /~master@latest/graphql |
  | - | POST /~dongwook/graphql | GET /~dongwook@latest/graphql |
  | - | GET /~ws-dev/chat | GET /~ws-dev@latest/chat |

  테이블의 각 행은 동일한 버전의 핸들러로 연결됩니다.

  브랜치 이름 규칙

  * 영문 소문자 및 숫자, `-`, `_`만 허용됩니다.
  * 기존 스키마 엔드포인트나 플러그인의 base 경로와 중복될 수 없습니다.

  태그 이름 규칙

  * 영문 소문자 및 숫자로만 구성됩니다.


# API Server

## Request Lifecycle

#### 1. Extension

Server Extension은 웹 서버를 생성 및 확장하는데 쓰입니다. 서버 생성 옵션을 통해 제어 할 수 있습니다.

**HTTP**

HTTP Extension은 HTTP 프로토콜을 지원하도록 웹 서버를 생성합니다. 기본적으로 활성화됩니다.

**HTTP/2**

HTTP/2 Extension은 HTTP/2 프로토콜을 지원하도록 웹 서버를 생성합니다.

**TLS**

TLS Extension은 HTTPS 요청을 처리 할 수 있도록 웹 서버를 생성합니다.

### 2. Middleware

엔드포인트로의 라우팅 전/후에 미들웨어들이 실행됩니다. 서버 생성 옵션을 통해 제어 할 수 있습니다.

#### A. Before Middleware

엔드포인트로의 라우팅 전에 수행되는 미들웨어입니다.

**Static**

Static Middleware는 최초로 수행되는 미들웨어입니다. 활성화시 API Gateway 서비스 노드의 특정 디렉토리에서 애셋 파일들을 서빙합니다.

**Body Parser**

Body Parser는 `application/json`, `application/x-www-form-url-encoded`, `multipart/form-data` Content Type 요청의 바디를 JavaScript 객체로 해석합니다.

**Cookie Parser**

Cookie Parser는 Cookie 헤더를 JavaScript 객체로 해석하고 검증합니다.

**CORS**

CORS 미들웨어는 교차 출처 자원 공유에 대한 접근 제어 정책에 따라 Preflight 요청에 응답합니다.

**Helmet**

Helmet 미들웨어는 서버에 CSP, HSTS 등 기초적인 보안 요소를 추가합니다.

#### B. Context Factory

엔드포인트로의 라우팅 직전에 Context Factory 미들웨어를 통해 요청 컨텍스트를 생성하게 됩니다. Context는 API Handler에 전달되는 인증, Locale, Language, TimeZone 등의 정보를 포함한 객체입니다.

**Locale**

Locale 컨텍스트는 요청 헤더로부터 Locale, Language, TimeZone 등의 정보를 추출합니다.

**Auth**

인증 컨텍스트를 활성화하기 위해서는 요청으로부터 서버 생성 옵션을 통해 인증 정보를 생성하는 함수를 구현해야합니다. 예를 들어 Bearer 토큰을 [moleculer-iam](https://github.com/qmit-pro/moleculer-iam) 피어 모듈을 통해 통해 파싱해 idToken을 획득하거나, 별도의 인증 서버에 전달해 원하는 방식대로 해석 할 수 있습니다.

#### C. After Middleware

엔드포인트로에서의 응답 후에 수행되는 미들웨어입니다.

**Error**

Error 미들웨어는 분산 서비스의 에러를 파악하고 HTTP 상태 코드를 설정하며 표준화된 에러 포맷의 응답을 생성합니다.

**ETag**

ETag 미들웨어는 GET, HEAD 요청 및 응답\(200 OK\)에서 If-None-Match 및 ETag 헤더를 활용해 API 클라이언트의 성능을 높힙니다.

**Header**

Header 미들웨어는 Header Context에 값이 할당된 경우 응답 헤더를 업데이트합니다.

### 3. API Handler

요청이 전처리 미들웨어, 컨텍스트 미들웨어를 통과 한 후에 동적으로 생성된 엔드포인트로 라우팅됩니다. API 핸들러를 통과 한 후 후처리 미들웨어를 지나 요청이 완료됩니다.

#### A. Dynamic Handler

동적 핸들러는 Gateway에 생성된 브랜치에 따라 요청을 브랜치 핸들러로 프록시합니다.

#### B. Branch Handler

브랜치 핸들러는 Gateway에 생성된 해당 브랜치의 태그에 따라 요청을 버전 핸들러로 프록시합니다.

#### C. Version Handler

버전 핸들러는 Gateway API 스키마에 따라 커넥터 및 프로토콜 플러그인을 조합해 생성한 핸들러로 요청을 프록시합니다.


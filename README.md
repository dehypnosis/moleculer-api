# Introduction

## moleculer-api

A dynamic API Gateway which updates REST endpoints, GraphQL schema, Websocket handlers and access control policies by integrating metadata of discovered remote services.

[![Build Status](https://travis-ci.org/qmit-pro/moleculer-api.svg?branch=master)](https://travis-ci.org/qmit-pro/moleculer-api) [![Coverage Status](https://coveralls.io/repos/github/qmit-pro/moleculer-api/badge.svg?branch=master)](https://coveralls.io/github/qmit-pro/moleculer-api?branch=master) [![David](https://img.shields.io/david/qmit-pro/moleculer-api.svg)](https://david-dm.org/qmit-pro/moleculer-api) [![Known Vulnerabilities](https://snyk.io/test/github/qmit-pro/moleculer-api/badge.svg)](https://snyk.io/test/github/qmit-pro/moleculer-api) [![NPM version](https://img.shields.io/npm/v/moleculer-api.svg)](https://www.npmjs.com/package/moleculer-api) [![Moleculer](https://badgen.net/badge/Powered%20by/Moleculer/0e83cd)](https://moleculer.services)

Moleculer API Gateway는 분산 서비스 환경에서 동적으로 마이크로 서비스들의 API 스키마를 수집하고 조합하며 무중단으로 API를 제공하는 웹 서버 모듈입니다.

서비스 API 스키마는 분산 서비스의 프로시저\(이하 **액션**\)의 호출\(`call`\)이나 중앙 메시징 서비스에 대한 **이벤트** 발행\(`publish`\) 및 구독\(`subscribe`\)을 웹 기반 프로토콜\(REST, GraphQL, WebSocket 지원\)의 엔드포인트에 맵핑합니다. 서비스 API 스키마는 단일한 JSON 포맷으로 구성되어있으며 각 맵핑에 대한 접근 제어 정책을 포함 할 수 있습니다.

서비스 API 스키마가 제거, 수정, 추가되면 Gateway는 기존 통합 API 스키마에 병합을 시도하고 성공시 무중단으로 라우터를 업데이트하며 그 결과 메시지를 원격 서비스에 다시 보고합니다.



### Features

* 분산 서비스의 API 스키마를 수집하고 병합하여 API를 실시간으로 업데이트
* 개발 편의를 위한 브랜치 및 태그
* 상태 검사 및 문서 생성
  * API Gateway 상태 검사
  * API 엔드포인트별 상태 검사
  * API 엔드포인트별 설명, 파라미터, 접근 제어 정보 생성
  * 분산 서비스 액션 및 이벤트 구독, 발행 정보 생성
* 확장 가능한 웹 서버 구성
  * Cookie/Body Parser
  * ETag
  * CORS
  * HTTP/2
  * TLS
* 미들웨어 방식의 컨텍스트 생성
  * 인증
  * Locale
* 프로토콜 플러그인 \(핸들러 및 스키마 확장\)
  * REST
  * GraphQL
  * WebSocket \(TODO\)
* 접근 제어 정책 플러그인 \(핸들러 및 스키마 확장\)
  * OAuth2 scope 기반 접근 제어
  * JavaScript [FBAC; Function Based Access Control](https://arxiv.org/abs/1609.04514) 기반 접근 제어

## Development

### 1. Yarn Scripts

* `yarn dev [example=simple]` - Start development \(nodemon with ts-node\)
* `yarn build`- Uses typescript to transpile service to javascript
* `yarn lint` - Run TSLint
* `yarn test` - Run tests & generate coverage report
* `yarn test --watch` - Watch and run tests

## Contribution

Please send pull requests improving the usage and fixing bugs, improving documentation and providing better examples, or providing some testing, because these things are important.

## License

The project is available under the [MIT license](https://tldrlegal.com/license/mit-license).

## Contact

Copyright \(c\) 2019 QMIT Inc.


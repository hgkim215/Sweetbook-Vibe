# AGENTS.md

## 프로젝트 목표

스위트북 개발과제를 Docker로 실행 가능한 풀스택 웹 애플리케이션으로 구현하고, Lv3까지 완성한다.

- Lv1: 콘텐츠 서비스 핵심 플로우
- Lv2: 책 주문 생성 및 상태 관리
- Lv3: 구조화된 주문 데이터 익스포트

콘텐츠 서비스가 본체이며, 책 제작은 콘텐츠를 활용한 부가 기능이다. 실제 `api.sweetbook.com`은 호출하지 않는다.

## 현재 단계

하네스 구축부터 시작한다. `docs/product/problem-brief.md`와 `docs/product/product-spec.md`가 완료되기 전까지 서비스 주제를 확정하지 않는다.

## 작업 규칙

- 작고 검증 가능한 단위로 변경한다.
- 기본 작업 브랜치는 `dev`다.
- 최소 기능 단위가 검증을 통과하면 `dev`에 푸시한다.
- 결정, 범위, 검증 결과가 바뀌면 관련 문서를 함께 갱신한다.
- 비밀값, API 키, `.env`, 로컬 DB 파일, 빌드 산출물, Obsidian 작업공간 파일은 커밋하지 않는다.
- 모든 프로젝트 문서와 앞으로 작성되는 문서는 기본적으로 한국어로 작성한다. 명령어, 코드 식별자, 파일명, API 경로, 라이브러리명은 필요한 경우 원문을 유지한다.

## 검증

- 빠른 검증: `scripts/verify-fast.sh`
- 전체 검증: `scripts/verify-full.sh`
- 품질 점수 기준: `docs/reliability/quality-score.md`
- 검증 기록: `docs/reliability/verification-log.md`

## 문서 지도

- 과제 및 제품 기획: `docs/product/`
- 아키텍처와 API/데이터 결정: `docs/architecture/`
- 실행 계획: `docs/exec-plans/`
- 신뢰성 및 품질 루프: `docs/reliability/`
- 환경변수와 비밀값 정책: `docs/security/`


# 하네스 및 과제 전달 계획

## 1. 목적

이 문서는 스위트북 개발과제를 Lv3까지 완성하고, 이후 사용자가 멈추라고 할 때까지 테스트, 검증, 개선을 반복하기 위한 프로젝트 하네스 운영 계획이다.

현재 단계의 목표는 실행 가능한 개발 시스템을 먼저 고정하는 것이다. 실제 앱 구현, Git 초기화, 브랜치 생성, 커밋, 푸시는 이 문서 작성 범위에 포함하지 않는다.

## 2. 과제 목표

최종 제출물은 독립 실행 가능한 웹 애플리케이션이다. 서비스의 중심은 콘텐츠이며, 책 주문은 콘텐츠를 활용한 부가 기능으로 설계한다.

구현 목표는 아래 3단계 전체 완료다.

| 레벨 | 목표 | 완료 기준 |
|---|---|---|
| Lv1 | 콘텐츠 서비스 구현 | 콘텐츠 생성, 조회, 수정, 삭제 또는 이에 준하는 핵심 플로우가 동작한다. |
| Lv2 | 책 주문 상태 관리 | 사용자가 콘텐츠를 책으로 주문하고, 주문 정보를 저장, 조회, 상태 변경할 수 있다. |
| Lv3 | 주문 데이터 익스포트 | 주문 1건에 필요한 콘텐츠와 메타데이터를 구조화된 데이터로 내보낼 수 있다. |

Lv3 이후에는 완성 선언으로 끝내지 않고, 품질점수 기반 개선 루프를 계속 반복한다.

## 3. 고정된 기본 결정

- 서비스 주제는 아직 고정하지 않는다.
- 주제는 `Problem Brief`와 `Product Spec` 작성 후 확정한다.
- 기술 스택은 `React + Vite + Express + SQLite + Docker Compose`로 고정한다.
- 실제 `api.sweetbook.com`은 호출하지 않는다.
- Lv3 익스포트는 우선 JSON으로 구현한다.
- 시간이 남으면 ZIP 익스포트 확장을 검토한다.
- 자동 푸시는 `dev` 브랜치에만 적용한다.
- `main` 브랜치는 제출 가능한 체크포인트에서만 갱신한다.

## 4. 하네스 구조

프로젝트는 짧은 루트 지침과 구조화된 문서, 검증 스크립트, CI를 함께 갖춘다.

```text
AGENTS.md
README.md
docker-compose.yml
.env.example
docs/
  product/
    assignment-brief.md
    problem-brief.md
    product-spec.md
    user-flows.md
  architecture/
    architecture.md
    api-contract.md
    data-model.md
  exec-plans/
    00-harness-and-delivery-plan.md
    01-problem-definition.md
    02-lv1-content-service.md
    03-lv2-book-orders.md
    04-lv3-order-export.md
  reliability/
    quality-score.md
    verification-log.md
    known-issues.md
  security/
    env-and-secret-policy.md
scripts/
  verify-fast.sh
  verify-full.sh
  quality-score.sh
  commit-and-push.sh
  smoke-docker.sh
.github/
  workflows/
    ci.yml
```

각 영역의 역할은 아래와 같다.

| 영역 | 역할 |
|---|---|
| `AGENTS.md` | 에이전트가 따라야 할 짧은 작업 지도 |
| `docs/product/` | 과제 해석, 문제 정의, 제품 스펙, 사용자 플로우 |
| `docs/architecture/` | API 계약, 데이터 모델, 아키텍처 결정 |
| `docs/exec-plans/` | 단계별 실행 계획과 의사결정 로그 |
| `docs/reliability/` | 품질 점수, 검증 이력, 알려진 이슈 |
| `docs/security/` | 환경변수, 비밀값, 제출 보안 정책 |
| `scripts/` | 반복 검증과 자동 커밋/푸시 도구 |
| `.github/workflows/` | 원격 CI 검증 |

## 5. Git 운영 정책

브랜치 전략은 `dev -> main`이다.

### dev 브랜치

- 모든 기능 개발은 `dev`에서 진행한다.
- 최소 기능 단위가 끝날 때마다 빠른 검증을 실행한다.
- 검증 통과 후 자동 커밋하고 `origin dev`로 푸시한다.
- 커밋은 기능 단위로 작게 유지한다.

### main 브랜치

- `main`은 제출 가능한 상태만 반영한다.
- 아래 체크포인트에서만 `dev`를 `main`으로 병합한다.
  - 하네스 부트스트랩 완료
  - 문제 정의 및 제품 스펙 확정
  - Lv1 완료
  - Lv2 완료
  - Lv3 완료
  - 제출 직전 최종 검증 완료

### 커밋 메시지 예시

```text
chore: bootstrap project harness
docs: define assignment and problem brief
feat: implement content CRUD
feat: add book order workflow
feat: export order payload as json
test: cover order export workflow
docs: finalize submission README
```

## 6. 검증 게이트

자동 커밋/푸시 전 기본 검증은 빠른 게이트로 운영한다. 전체 검증은 main 병합 전과 각 레벨 완료 시점에 실행한다.

### 빠른 검증: `scripts/verify-fast.sh`

필수 검증 항목:

```bash
npm run lint
npm run typecheck
npm test
```

사용 시점:

- 최소 기능 단위 완료 후
- `dev` 자동 커밋/푸시 직전
- 작은 리팩터링 완료 후

### 전체 검증: `scripts/verify-full.sh`

필수 검증 항목:

```bash
npm run lint
npm run typecheck
npm test
npm run build
docker compose up --build
scripts/smoke-docker.sh
```

사용 시점:

- `main` 병합 전
- Lv1, Lv2, Lv3 완료 시점
- 제출 직전

## 7. 품질점수 순환

구현이 한 번 완료되어도 작업을 종료하지 않는다. 사용자가 멈추라고 하기 전까지 아래 루프를 반복한다.

1. 현재 상태를 품질 점수표로 평가한다.
2. 가장 낮은 점수의 항목을 1개 고른다.
3. 해당 항목을 개선 가능한 최소 작업으로 나눈다.
4. 구현한다.
5. 빠른 검증을 실행한다.
6. 통과하면 커밋하고 `dev`에 푸시한다.
7. `docs/reliability/quality-score.md`와 `docs/reliability/verification-log.md`를 갱신한다.
8. 다시 1번으로 돌아간다.

품질 점수 항목:

| 항목 | 평가 기준 |
|---|---|
| Product Fit | 과제 의도와 콘텐츠 본체/책 부가 기능 구조가 명확한가 |
| Lv1 Completeness | 콘텐츠 핵심 플로우가 안정적으로 동작하는가 |
| Lv2 Business Logic | 주문 생성, 조회, 상태 변경이 자연스럽게 동작하는가 |
| Lv3 Export Quality | 주문 1건의 콘텐츠와 메타데이터가 구조화되어 뽑히는가 |
| UX Clarity | 심사자가 로그인 없이 플로우를 바로 이해할 수 있는가 |
| Architecture | API, 데이터 모델, 디렉터리 구조가 설명 가능한가 |
| Test Coverage | 핵심 로직과 API가 테스트로 검증되는가 |
| Docker Reliability | README 명령 그대로 실행되는가 |
| README Quality | 심사자가 README만 보고 실행 및 평가할 수 있는가 |

점수 기준:

| 점수 | 의미 |
|---|---|
| 5 | 제출 기준에서 강점으로 보임 |
| 4 | 제출 가능하며 작은 개선 여지만 있음 |
| 3 | 동작은 하지만 평가 리스크가 있음 |
| 2 | 구현 또는 설명이 불완전함 |
| 1 | 제출 전 반드시 수정해야 함 |

## 8. 단계별 실행 계획

### 1단계. Harness Bootstrap

- Git 저장소와 브랜치 전략을 구성한다.
- `AGENTS.md`를 짧은 지도 형태로 작성한다.
- `docs/`, `scripts/`, `.github/workflows/` 기본 구조를 만든다.
- 빠른 검증과 전체 검증 스크립트를 추가한다.
- 첫 검증 후 `dev`에 푸시한다.

### 2단계. Problem Definition

- 서비스 주제를 바로 기능으로 정하지 않는다.
- 후보 문제를 `Fact`, `Assumption`, `Unknown`으로 분리한다.
- 콘텐츠가 본체이고 책 주문이 부가 기능이 되는 구조인지 검토한다.
- `docs/product/problem-brief.md`를 작성한다.

### 3단계. Product Spec

- 확정된 문제를 기준으로 서비스 주제를 고정한다.
- Lv1, Lv2, Lv3의 기능 범위를 명확히 나눈다.
- 사용자 플로우, API, 데이터 모델의 초안을 확정한다.
- `docs/product/product-spec.md`와 `docs/product/user-flows.md`를 작성한다.

### 4단계. Lv1 Content Service

- 콘텐츠 목록, 상세, 생성, 수정, 삭제 플로우를 구현한다.
- 로그인 없이 확인 가능한 더미 데이터를 포함한다.
- 프론트엔드와 백엔드 API를 연결한다.
- 단위 테스트와 API 테스트를 추가한다.

### 5단계. Lv2 Book Order Workflow

- 콘텐츠를 선택해 책 주문을 생성하는 기능을 구현한다.
- 주문 목록과 상세 화면을 구현한다.
- 주문 상태를 변경할 수 있게 한다.
- 상태 전이와 주문 조회를 테스트한다.

### 6단계. Lv3 Order Export

- 주문 1건의 주문 정보, 포함 콘텐츠, 메타데이터를 JSON으로 익스포트한다.
- 익스포트 결과가 파트너 전달용 데이터처럼 읽히도록 구조화한다.
- API 테스트와 UI 다운로드 플로우를 검증한다.
- 시간이 남으면 ZIP 익스포트 확장을 검토한다.

### 7단계. Submission Hardening

- Docker Compose 실행을 검증한다.
- README를 제출용으로 완성한다.
- `.env.example`, `.gitignore`, 포트 변경 방법을 확인한다.
- GitHub Public 접근을 확인한다.
- 구글폼 답변 초안을 작성한다.
- 최종 검증 후 `main`에 병합한다.

### 8단계. Quality Score Iteration

- 품질 점수표로 현재 상태를 다시 평가한다.
- 가장 낮은 항목부터 개선한다.
- 개선 결과를 검증하고 `dev`에 푸시한다.
- 필요한 경우 다시 `main`에 반영한다.

## 9. 중단 및 질문 기준

아래 상황에서는 진행을 멈추고 사용자에게 질문한다.

- 서비스 주제를 확정해야 하는 시점
- 과제 범위를 줄이거나 늘리는 결정이 필요한 시점
- `main` 병합 또는 제출 직전 최종 상태 확인이 필요한 시점
- 자동 푸시 정책을 바꿔야 하는 시점
- 구현 중 사용자 경험이나 사업 방향의 해석이 크게 갈리는 시점

그 외에는 하네스 문서와 검증 루프를 기준으로 계속 진행한다.


# GrowthBook

GrowthBook은 흩어진 학습, 프로젝트, 회고, 실패, 개선 기록을 `성장기록`으로 정리하고, 선택한 기록을 `성장기록집` 주문 데이터로 내보내는 웹 애플리케이션입니다.

서비스의 본체는 성장기록 콘텐츠 관리입니다. 책 주문은 쌓인 성장기록을 소장 가능한 성장기록집으로 전환하는 부가 기능입니다.

## 주요 기능

- 성장기록 목록, 상세, 생성, 수정, 삭제
- 로그인 없이 바로 확인 가능한 더미 성장기록
- 선택한 성장기록 기반 챕터 구성 제안
- OpenAI API 키가 있으면 AI 보조 정리자 사용
- OpenAI API 키가 없으면 규칙 기반 Mock 보조 정리자로 자동 fallback
- 성장기록집 주문 생성, 목록/상세 조회, 상태 변경
- 주문 1건에 필요한 주문 정보, 챕터, 포함 기록, 메타데이터 JSON 다운로드

## 완성 레벨

| 레벨 | 구현 내용 |
|---|---|
| Lv1 | 성장기록 생성, 조회, 수정, 삭제와 더미 데이터 제공 |
| Lv2 | 성장기록 선택 후 성장기록집 주문 생성, 주문 목록/상세, 상태 변경 |
| Lv3 | 주문 1건에 필요한 데이터 JSON 익스포트 |

## 실행 방법

### 1. 저장소 클론

```bash
git clone https://github.com/hgkim215/Sweetbook-Vibe.git
cd Sweetbook-Vibe
```

### 2. 환경변수 파일 준비

```bash
cp .env.example .env
```

OpenAI API 키 없이도 실행됩니다. 키가 없으면 Mock 보조 정리자가 동작합니다.

OpenAI 보조 정리자를 사용하려면 `.env`에 값을 넣습니다.

```bash
OPENAI_API_KEY=your_api_key_here
OPENAI_MODEL=gpt-5.4
```

실제 키는 반드시 로컬 `.env`에만 넣습니다. `.env`는 `.gitignore` 대상이며 커밋하지 않습니다. README, 이슈, 커밋 메시지, 문서에는 실제 키를 적지 않습니다.

OpenAI 경로가 정상 동작하면 `챕터 제안` 응답의 `source`가 `openai`로 내려옵니다. OpenAI 계정의 쿼터나 결제 상태 문제로 `429 insufficient_quota`가 발생하면 앱은 자동으로 `source: "mock"` 제안으로 전환됩니다.

### 3. Docker로 실행

```bash
docker compose up --build
```

브라우저에서 접속합니다.

```text
http://localhost:3000
```

### 포트 변경

기본 포트는 `3000`입니다. 포트 충돌이 있으면 실행 전에 `PORT`를 지정합니다.

```bash
PORT=4000 docker compose up --build
```

이 경우 접속 주소는 아래와 같습니다.

```text
http://localhost:4000
```

## 바로 확인할 플로우

1. 첫 화면에서 더미 성장기록 3개를 확인합니다.
2. 왼쪽 목록에서 성장기록을 선택합니다.
3. 성장기록을 새로 추가하거나 기존 기록을 수정합니다.
4. 책에 포함할 성장기록을 체크합니다.
5. `챕터 제안`을 눌러 성장기록집 구성을 만듭니다.
6. 책 제목, 작성자명, 요청사항을 확인하고 `주문 생성`을 누릅니다.
7. 주문 목록에서 생성된 주문을 선택합니다.
8. 주문 상태를 `pending -> processing -> completed`로 변경합니다.
9. `JSON 다운로드`를 눌러 주문 데이터 익스포트를 확인합니다.

## 로컬 개발

Docker 없이 로컬에서 실행하려면 아래 명령을 사용합니다.

```bash
npm install
npm run build
npm run dev
```

개발 서버는 기본적으로 아래 주소를 사용합니다.

```text
http://localhost:3000
```

## 검증 명령

빠른 검증:

```bash
scripts/verify-fast.sh
```

전체 검증:

```bash
scripts/verify-full.sh
```

전체 검증은 lint, typecheck, test, build, Docker Compose 실행, `/api/health` smoke test, Lv1-Lv3 API 플로우 smoke test를 포함합니다.

## 기술 스택

- 프론트엔드: React + Vite
- 백엔드: Express
- 데이터 저장: SQLite
- 테스트: Vitest + Supertest
- 실행 환경: Docker Compose

## 아키텍처

```text
Browser
  -> React/Vite UI
  -> Express REST API
  -> SQLite
```

핵심 API:

| Method | Path | 설명 |
|---|---|---|
| GET | `/api/records` | 성장기록 목록 |
| POST | `/api/records` | 성장기록 생성 |
| PUT | `/api/records/:id` | 성장기록 수정 |
| DELETE | `/api/records/:id` | 성장기록 삭제 |
| POST | `/api/assist/chapter-suggestions` | 챕터 구성 제안 |
| GET | `/api/orders` | 주문 목록 |
| POST | `/api/orders` | 주문 생성 |
| PATCH | `/api/orders/:id/status` | 주문 상태 변경 |
| GET | `/api/orders/:id/export` | 주문 데이터 JSON 익스포트 |

## AI 도구 사용 내역

| 도구 | 활용 내용 |
|---|---|
| Codex | 과제 요구사항 분석, 하네스 구성, 제품 명세 작성, 구현, 테스트, README 작성 |
| OpenAI API 선택 옵션 | `.env`에 키가 있을 때 SDK와 구조화 출력으로 성장기록 기반 챕터 제안을 생성하도록 설계 |
| Mock 보조 정리자 | API 키가 없어도 동일한 사용자 플로우를 검증할 수 있도록 fallback 구현 |

## 설계 의도

스위트북 과제의 핵심은 “책 제작 앱”을 만드는 것이 아니라, 책으로 전환할 수 있는 콘텐츠 서비스의 본체를 설계하는 것입니다. GrowthBook은 사용자가 여러 곳에 흩어둔 성장 기록을 먼저 정리하게 하고, 그 기록을 선택해 성장기록집 주문 데이터로 내보냅니다.

AI는 사용자의 내용을 대신 만들어내지 않습니다. 사용자가 남긴 기록을 바탕으로 챕터 구성, 요약, 누락 질문을 제안하는 보조 정리자 역할만 합니다. 최종 판단과 수정은 사용자가 하도록 설계했습니다.

## 제외한 기능

- 회원가입/로그인
- 결제
- 배송
- 실제 `api.sweetbook.com` 호출
- 인쇄용 PDF 생성
- 자동 채용 평가 또는 자기소개서 대필

## 더 시간이 있다면

- ZIP 익스포트 추가
- 챕터 편집 UX 강화
- 성장기록 가져오기 기능
- 주문 상태 변경 이력 기록
- 브라우저 E2E 테스트 추가

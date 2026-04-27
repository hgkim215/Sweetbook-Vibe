# 검증 기록

의미 있는 검증 실행 결과를 여기에 기록한다.

| 날짜 | 명령 | 결과 | 메모 |
|---|---|---|---|
| 2026-04-28 | 하네스 부트스트랩 대기 상태 | 대기 | 앱 스캐폴딩 전 초기 로그를 생성했다. |
| 2026-04-28 | `scripts/verify-fast.sh` | 통과 | 2단계 문제 정의 문서화 후 앱 미구성 상태를 하네스 대기 상태로 정상 처리했다. |
| 2026-04-28 | 사용자 승인 | 완료 | 성장 포트폴리오 기반 “성장기록집” 서비스를 최종 아이디어로 확정했다. |
| 2026-04-28 | 제품 명세 작성 | 완료 | GrowthBook 제품 명세와 사용자 플로우를 작성했다. |
| 2026-04-28 | `scripts/verify-fast.sh` | 통과 | 앱 스캐폴딩, Lv1-Lv3 API, Mock 보조 정리자 테스트가 통과했다. |
| 2026-04-28 | `npm run build` | 통과 | Vite 프론트엔드와 Express 서버 TypeScript 빌드가 통과했다. |
| 2026-04-28 | `scripts/verify-full.sh` | 통과 | Docker Compose 빌드, 실행, `/api/health` smoke test가 통과했다. |
| 2026-04-28 | README 작성 | 완료 | 처음 보는 사람이 실행할 수 있도록 Docker 실행법, 포트 변경, 주요 플로우를 작성했다. |
| 2026-04-28 | 브라우저 첫 화면 확인 | 보완 | 첫 화면은 렌더링됐고, H1 줄바꿈이 거칠어 타이포 크기와 단어 줄바꿈을 보완했다. |
| 2026-04-28 | 브라우저 데스크톱/모바일 확인 | 통과 | 첫 화면이 데스크톱과 모바일에서 글자 겹침 없이 렌더링됐다. |
| 2026-04-28 | API 수동 플로우 | 통과 | 더미 기록 조회, Mock 챕터 제안, 주문 생성, 상태 변경, JSON 익스포트를 확인했다. |
| 2026-04-28 | `main` 반영 | 완료 | `dev`와 `main`을 최신 커밋으로 맞추고 GitHub 기본 브랜치를 `main`으로 변경했다. |
| 2026-04-28 | OpenAI 키 로컬 `.env` 등록 | 완료 | 실제 키는 `.env`에만 저장했고 `git status --short`에 보이지 않음을 확인했다. |
| 2026-04-28 | OpenAI 실제 경로 엔드포인트 검증 | 제한적 통과 | `.env` 키를 로드해 `/api/assist/chapter-suggestions`를 호출했으나 OpenAI API가 `429`를 반환했다. 앱은 `source: "mock"`으로 정상 fallback했다. |
| 2026-04-28 | 키 없는 환경 fallback 엔드포인트 검증 | 통과 | `OPENAI_API_KEY=` 상태로 서버를 실행하고 같은 엔드포인트가 `source: "mock"`, 챕터 2개를 반환함을 확인했다. |
| 2026-04-28 | `scripts/verify-fast.sh` | 통과 | `.env` 로더, OpenAI 오류 fallback 테스트, JSON 파싱 실패 fallback 테스트가 포함된 빠른 검증이 통과했다. |
| 2026-04-28 | Docker build context 보안 점검 | 보완 | `.env`가 Docker build context에 포함될 수 있어 `.dockerignore`를 추가했다. |
| 2026-04-28 | `scripts/verify-full.sh` | 통과 | `.dockerignore` 반영 후 lint, typecheck, test, build, Docker Compose, `/api/health` smoke test가 통과했다. Docker build context는 약 9KB로 줄어 로컬 비밀값과 산출물이 제외됐다. |
| 2026-04-28 | `origin/dev` 푸시 | 완료 | `chore: harden openai assistant secret handling` 커밋을 `dev`에 푸시했다. |
| 2026-04-28 | 상태 문서 갱신 | 완료 | OpenAI 키 포함 반복 개선 결과를 현재 상태 문서에 반영했다. |
| 2026-04-28 | `origin/main` 반영 | 완료 | 전체 검증이 통과한 OpenAI 보안/검증 개선을 제출 브랜치 `main`에 반영했다. |
| 2026-04-28 | OpenAI SDK 구조화 출력 전환 | 완료 | 직접 `fetch` 호출을 OpenAI JS SDK와 Zod 구조화 출력으로 교체하고 성공/429/refusal/키 없음 테스트를 추가했다. |
| 2026-04-28 | `scripts/verify-fast.sh` | 통과 | OpenAI SDK 구조화 출력 전환 후 lint, typecheck, test가 통과했다. |
| 2026-04-28 | OpenAI 실제 경로 재시도 | 제한적 통과 | 현재 `.env` 키로 실제 호출했으나 OpenAI가 `429 insufficient_quota`를 반환했다. 앱은 HTTP 200, `source: "mock"`, 챕터 2개, 잘못된 recordIds 0개로 정상 fallback했다. |
| 2026-04-28 | `scripts/verify-full.sh` | 통과 | OpenAI SDK 구조화 출력 전환 후 lint, typecheck, test, build, Docker Compose, `/api/health` smoke test가 통과했다. |
| 2026-04-28 | `origin/dev` 푸시 | 완료 | `feat: use structured openai assistant output` 커밋을 `dev`에 푸시했다. |
| 2026-04-28 | `origin/main` 반영 | 완료 | OpenAI SDK 구조화 출력 전환을 제출 브랜치 `main`에 반영했다. |
| 2026-04-28 | Lv1-Lv3 API smoke test 보강 | 진행 중 | Docker 전체 검증에서 헬스체크 외에 성장기록 CRUD, 챕터 제안, 주문 상태 변경, JSON 익스포트를 확인하도록 보강한다. |
| 2026-04-28 | `scripts/verify-full.sh` | 통과 | Lv1-Lv3 API smoke test가 Docker 환경에서 통과했다. |
| 2026-04-28 | Docker 검증 볼륨 정리 개선 | 완료 | 전체 검증이 테스트용 Compose project를 사용하고 검증 후 볼륨을 제거하도록 보강했다. |
| 2026-04-28 | `scripts/verify-full.sh` | 통과 | 테스트용 Compose project, Lv1-Lv3 API smoke test, 볼륨 제거까지 포함해 전체 검증이 통과했다. |
| 2026-04-28 | `origin/dev`, `origin/main` 반영 | 완료 | Lv1-Lv3 API smoke test와 Docker 검증 볼륨 정리 개선을 두 브랜치에 반영했다. |
| 2026-04-28 | Gemini API 전환 | 완료 | OpenAI API 과금 한계로 AI 보조 정리자를 Gemini API 기반으로 교체했다. 키 위치는 로컬 `.env`의 `GEMINI_API_KEY`로 고정한다. |
| 2026-04-28 | `scripts/verify-fast.sh` | 통과 | Gemini SDK 구조화 출력 전환 후 lint, typecheck, test가 통과했다. |
| 2026-04-28 | Gemini 키 미설정 fallback 엔드포인트 검증 | 통과 | `.env`에 Gemini 키가 없는 상태에서 HTTP 200, `source: "mock"`, 챕터 2개를 확인했다. |
| 2026-04-28 | `npm run build` | 통과 | Gemini 전환 후 Vite 프론트엔드와 Express 서버 TypeScript 빌드가 통과했다. |
| 2026-04-28 | `scripts/verify-full.sh` | 환경 중단 | lint, typecheck, test, build는 통과했지만 Docker 데몬이 준비되지 않아 Docker 단계에서 중단됐다. |
| 2026-04-28 | `origin/dev` 푸시 | 완료 | `feat: switch assistant to gemini api` 커밋을 `dev`에 푸시했다. `main` 반영은 Docker 재검증 전까지 보류한다. |

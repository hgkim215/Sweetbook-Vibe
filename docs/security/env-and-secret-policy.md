# 환경변수와 비밀값 정책

## 규칙

- `.env` 또는 실제 비밀값이 들어 있는 파일은 커밋하지 않는다.
- `.env` 또는 실제 비밀값이 들어 있는 파일은 Docker build context에도 포함하지 않는다.
- 환경변수가 필요할 때는 `.env.example`만 커밋한다.
- API 키, OAuth 토큰, 비밀번호, 개인 키, 개인 인증 정보는 커밋하지 않는다.
- 이번 과제에서는 실제 `api.sweetbook.com`을 호출하지 않는다.
- OpenAI API 키는 로컬 `.env`의 `OPENAI_API_KEY`에만 저장한다.
- OpenAI 모델명은 비밀값이 아니지만, 실제 키와 같은 줄에 기록하지 않는다.
- 의도적으로 seed fixture를 추가하기 전까지 로컬 SQLite 데이터베이스 파일은 Git에 포함하지 않는다.

## 허용

- `.env.example` 안의 문서화된 placeholder 값
- 비밀값이 아닌 포트와 환경 이름
- mock 파트너 이름과 mock 익스포트 메타데이터
- `OPENAI_MODEL=gpt-5.4` 같은 모델명 설정

## OpenAI 키 검증 절차

1. `.env.example`을 복사해 `.env`를 만든다.
2. `.env`에만 `OPENAI_API_KEY`를 넣는다.
3. `git status --short`에서 `.env`가 보이지 않는지 확인한다.
4. 서버를 실행한 뒤 `/api/assist/chapter-suggestions` 응답이 `source: "openai"`인지 확인한다.
5. 잘못된 키 또는 키 없는 환경에서도 `source: "mock"` fallback이 동작하는지 확인한다.
6. 검증 결과는 `docs/reliability/verification-log.md`에 기록하되 실제 키는 기록하지 않는다.

## 리뷰 체크리스트

커밋 또는 푸시 전 확인한다.

- `git status --short`에 `.env`가 없다.
- `.dockerignore`가 `.env`, `.env.*`, 로컬 DB, 빌드 산출물을 제외한다.
- staged 파일에 비밀값처럼 보이는 값이 없다.
- README, 문서, 커밋 메시지에 실제 OpenAI 키가 없다.
- 로컬 DB 파일이 staged 상태가 아니다.
- Obsidian 작업공간 파일이 무시되고 있다.

# 환경변수와 비밀값 정책

## 규칙

- `.env` 또는 실제 비밀값이 들어 있는 파일은 커밋하지 않는다.
- 환경변수가 필요할 때는 `.env.example`만 커밋한다.
- API 키, OAuth 토큰, 비밀번호, 개인 키, 개인 인증 정보는 커밋하지 않는다.
- 이번 과제에서는 실제 `api.sweetbook.com`을 호출하지 않는다.
- 의도적으로 seed fixture를 추가하기 전까지 로컬 SQLite 데이터베이스 파일은 Git에 포함하지 않는다.

## 허용

- `.env.example` 안의 문서화된 placeholder 값
- 비밀값이 아닌 포트와 환경 이름
- mock 파트너 이름과 mock 익스포트 메타데이터

## 리뷰 체크리스트

커밋 또는 푸시 전 확인한다.

- `git status --short`에 `.env`가 없다.
- staged 파일에 비밀값처럼 보이는 값이 없다.
- 로컬 DB 파일이 staged 상태가 아니다.
- Obsidian 작업공간 파일이 무시되고 있다.


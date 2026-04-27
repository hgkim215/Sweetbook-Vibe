# 현재 진행 상태

## 요약

- 현재 단계: Gemini API 전환 및 Docker 재검증 완료, `main` 반영 준비
- 브랜치: `dev`
- 서비스명: GrowthBook
- 핵심 콘텐츠 단위: 성장기록
- 최종 목표: Lv3까지 구현 후 전체 검증, `main` 자동 반영, 이후 반복 개선
- 상태 업데이트 규칙: 단계 시작, 기능 단위 완료, 검증 실행, 커밋/푸시 후 갱신

## 완료

- 1단계 하네스 부트스트랩
- 2단계 문제 정의
- 최종 아이디어 확정: 성장 포트폴리오 기반 성장기록집 서비스

## 진행 중

- Gemini SDK 구조화 출력 전환 완료
- 로컬 `.env`를 Gemini 키 기준으로 전환 완료
- 키 미설정 Mock fallback 확인 완료
- Gemini 전환 후 Docker 전체 검증 완료
- Lv1-Lv3 API smoke test 추가 완료
- 테스트용 Docker 볼륨 정리 개선 완료
- Gemini 전환 `origin/dev` 반영 완료
- Gemini 전환 `origin/main` 반영은 Docker 재검증 전까지 보류

## 다음 작업

1. `dev`와 `main`에 최종 반영
2. Gemini 키를 넣은 뒤 실제 `source: "gemini"` 경로 검증
3. 다음 품질 반복 개선 항목 탐색

## 최근 검증

- `scripts/verify-fast.sh`: 통과
- `npm run build`: 통과
- `scripts/verify-full.sh`: 통과
- 브라우저 데스크톱/모바일 화면 확인: 통과
- API 수동 플로우: 통과
- `main` 브랜치 반영: 완료
- GitHub 기본 브랜치 `main`: 완료
- `.env` Git 무시 확인: 통과
- OpenAI 실제 경로 검증: OpenAI API `429` 응답으로 Mock fallback 전환 확인
- 키 없는 환경의 Mock fallback 엔드포인트 검증: 통과
- OpenAI API 오류/JSON 파싱 실패 fallback 회귀 테스트: 통과
- Docker build context 비밀값 차단: `.dockerignore` 추가
- `scripts/verify-full.sh`: 통과
- OpenAI SDK 구조화 출력 자동 테스트: 통과
- 실제 OpenAI 호출 재시도: `429 insufficient_quota`로 Mock fallback 확인
- OpenAI SDK 전환 후 `scripts/verify-full.sh`: 통과
- `origin/dev` 푸시: 완료
- `origin/main` 반영: 완료
- Lv1-Lv3 API smoke test: 통과
- 테스트용 Docker 볼륨 제거: 통과
- Lv1-Lv3 API smoke test 포함 `scripts/verify-full.sh`: 통과
- Gemini SDK 구조화 출력 자동 테스트: 통과
- Gemini 키 미설정 Mock fallback 실제 엔드포인트 검증: 통과
- Gemini 전환 후 `npm run build`: 통과
- Gemini 전환 `origin/dev` 푸시: 완료
- Gemini 전환 후 `scripts/verify-full.sh`: Docker 데몬 미준비로 Docker 단계에서 중단
- Docker Desktop 재기동 후 `scripts/verify-full.sh`: 통과

## 최근 반영

- OpenAI API 과금 한계 때문에 AI 공급자를 Gemini API로 교체했다. Gemini 키는 `.env`의 `GEMINI_API_KEY`에 넣는다. 현재 키는 비어 있으며, 키가 없으면 Mock fallback이 정상 동작한다. Docker 재검증까지 통과했다.

## 주의사항

- 실제 `api.sweetbook.com`은 호출하지 않는다.
- Gemini API 키는 로컬 `.env`에만 두고 커밋하지 않는다.
- Gemini API 키가 없어도 Mock 보조 정리자가 동작해야 한다.
- README는 처음 보는 사람이 바로 실행할 수 있는 제출용 문서로 유지한다.

# 현재 진행 상태

## 요약

- 현재 단계: 앱 스캐폴딩 및 Lv1-Lv3 1차 구현
- 브랜치: `dev`
- 서비스명: GrowthBook
- 핵심 콘텐츠 단위: 성장기록
- 최종 목표: Lv3까지 구현 후 전체 검증, `main` 자동 반영
- 상태 업데이트 규칙: 단계 시작, 기능 단위 완료, 검증 실행, 커밋/푸시 후 갱신

## 완료

- 1단계 하네스 부트스트랩
- 2단계 문제 정의
- 최종 아이디어 확정: 성장 포트폴리오 기반 성장기록집 서비스

## 진행 중

- React/Vite 프론트엔드와 Express/SQLite 백엔드 구현
- 성장기록 CRUD, 주문 관리, JSON 익스포트 1차 구현

## 다음 작업

1. 전체 검증과 Docker smoke test
2. README 제출용 작성
3. 브라우저 수동 검증
4. 품질 점수 재평가

## 최근 검증

- `scripts/verify-fast.sh`: 통과
- `npm run build`: 통과

## 최근 커밋

- `4916ac1 docs: define growthbook product spec`

## 주의사항

- 실제 `api.sweetbook.com`은 호출하지 않는다.
- OpenAI API 키가 없어도 Mock 보조 정리자가 동작해야 한다.
- README는 처음 보는 사람이 바로 실행할 수 있는 제출용 문서로 유지한다.

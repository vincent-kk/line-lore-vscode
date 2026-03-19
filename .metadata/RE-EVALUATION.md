# Line Lore VSCode Extension — Re-evaluation Guide

## 1. 목적

이 문서는 `LINE-LORE-IMPROVEMENT-REQUEST.md` 반영 이후 재평가 흐름을 안내하는 인덱스 문서이다.

재평가 문서는 아래 두 개로 분리한다.

- [DEV-COMPLETE-CHECKLIST.md](./DEV-COMPLETE-CHECKLIST.md)
  - 개발 완료 직후 구현 담당자가 먼저 보는 셀프체크 문서
- [SPEC-EXPANSION-REVIEW.md](./SPEC-EXPANSION-REVIEW.md)
  - 개발 완료 후 정말 스펙 확장이 수용되었는지 판정하는 리뷰 문서

---

## 2. 권장 순서

1. 개발자가 [DEV-COMPLETE-CHECKLIST.md](./DEV-COMPLETE-CHECKLIST.md) 로 구현 완료 여부를 점검한다.
2. 그 다음 [SPEC-EXPANSION-REVIEW.md](./SPEC-EXPANSION-REVIEW.md) 로 스펙 확장 수용 여부를 판정한다.
3. 리뷰 결과가 `Accepted`이면 `API-SPEC.md`를 실제 인터페이스 문서로 승격한다.

---

## 3. 각 문서의 역할

- `DEV-COMPLETE-CHECKLIST.md`
  - 개발이 끝났는가
  - 필요한 파일, 타입, 테스트, 문서 수정이 들어갔는가

- `SPEC-EXPANSION-REVIEW.md`
  - 요청한 스펙 확장이 실제로 수용되었는가
  - `API-SPEC.md`를 목표 문서에서 실제 문서로 바꿔도 되는가

---

## 4. 판단 기준

최종 판정은 [SPEC-EXPANSION-REVIEW.md](./SPEC-EXPANSION-REVIEW.md) 의 결과를 따른다.

- `Accepted`
- `Accepted with gaps`
- `Reopen`

---

## 5. 문서 갱신 규칙

- `Accepted`: `API-SPEC.md`를 실제 인터페이스 문서로 승격
- `Accepted with gaps`: `API-SPEC.md`는 유지하되 미완료 부분 표시
- `Reopen`: 요청서를 기준으로 추가 작업 정리

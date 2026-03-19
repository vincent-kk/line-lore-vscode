# Line Lore VSCode Extension — Development Completion Checklist

## 1. 목적

이 문서는 `line-lore` 개발 수정이 끝난 직후, 구현 담당자가 먼저 확인하는 셀프체크 문서이다.

목표는 두 가지이다.

- 요청한 변경이 코드에 실제로 들어갔는지 빠르게 점검
- 다음 단계인 스펙 확장 수용 판정 리뷰에 넘길 상태인지 확인

---

## 2. 사용 시점

다음 작업이 끝난 직후 사용한다.

- 공개 export 수정
- 타입 정의 수정
- `graph`, `deep`, `graphDepth`, `noCache` 관련 구현 수정
- README / README-ko_kr 수정
- 테스트 추가 또는 수정

---

## 3. 개발 완료 체크리스트

### 3.1 공개 API

- [ ] `src/index.ts` 기준 공개 export가 변경 의도와 일치한다
- [ ] 고수준 `graph()` 또는 이에 준하는 공개 진입점이 존재한다
- [ ] graph 사용 시 외부 소비자가 `PlatformAdapter`를 직접 만들 필요가 없다
- [ ] `health()` 반환 형태가 타입/문서와 일치한다

### 3.2 타입 정의

- [ ] `TraceOptions`가 라이브러리 의미 중심으로 정리되었다
- [ ] CLI 전용 옵션(`json`, `output`, `quiet`)이 분리되었거나 deprecated 처리되었다
- [ ] `GraphOptions`와 `GraphResult`가 공개 API 설명과 일치한다

### 3.3 핵심 동작

- [ ] `deep`가 실제 추적 경로 또는 탐색 범위에 영향을 준다
- [ ] `graphDepth`가 실제 동작에 연결되었거나 옵션 제거로 정리되었다
- [ ] `noCache`가 실제 내부 캐시 경로에 반영된다
- [ ] `trace()`는 문서에 적힌 수준으로 결과를 반환한다
- [ ] `graph()`는 문서에 적힌 수준으로 결과를 반환한다

### 3.4 문서

- [ ] `README.md`가 실제 구현과 일치한다
- [ ] `README-ko_kr.md`가 실제 구현과 일치한다
- [ ] CLI 예시가 실제 명령 구조와 일치한다
- [ ] 라이브러리 예시가 실제 import/export와 일치한다

### 3.5 테스트

- [ ] 새 공개 계약을 검증하는 테스트가 추가되었다
- [ ] `graph` 라이브러리 API 테스트가 있다
- [ ] `deep` 관련 테스트가 있다
- [ ] `graphDepth` 관련 테스트가 있다
- [ ] `noCache` 관련 테스트가 있다

---

## 4. 빠른 확인 파일

- `packages/line-lore/src/index.ts`
- `packages/line-lore/src/core/core.ts`
- `packages/line-lore/src/core/issue-graph/issue-graph.ts`
- `packages/line-lore/src/types/trace.ts`
- `packages/line-lore/src/types/graph.ts`
- `packages/line-lore/src/commands/trace.tsx`
- `packages/line-lore/src/commands/graph.tsx`
- `packages/line-lore/README.md`
- `packages/line-lore/README-ko_kr.md`

---

## 5. 개발 완료 판정

아래 조건을 만족하면 다음 단계로 넘긴다.

- 공개 API 관련 체크가 모두 완료됨
- 핵심 동작 관련 체크에서 미완료가 없음
- 문서와 테스트가 최소 수준 이상 따라옴

다음 단계 문서:

- [SPEC-EXPANSION-REVIEW.md](./SPEC-EXPANSION-REVIEW.md)

이 문서는 “개발이 끝났는가”를 보는 용도이고, 최종적으로 “스펙 확장이 수용되었는가”의 판정은 다음 문서에서 수행한다.

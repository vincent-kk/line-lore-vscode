# Line Lore VSCode Extension — Spec Expansion Review

## 1. 목적

이 문서는 개발 완료 후, `line-lore`가 정말로 요청된 스펙 확장을 수용했는지 판정하는 리뷰 문서이다.

핵심 질문은 하나이다.

- `LINE-LORE-IMPROVEMENT-REQUEST.md`의 요구가 반영되어 `API-SPEC.md` 수준의 인터페이스 확장이 실제로 이루어졌는가

즉 이 문서는 단순 구현 완료 확인이 아니라, **스펙 확장 수용 여부**를 판정하는 최종 문서이다.

---

## 2. 입력 문서

리뷰 시 반드시 아래 세 문서를 함께 본다.

- [LINE-LORE-IMPROVEMENT-REQUEST.md](./LINE-LORE-IMPROVEMENT-REQUEST.md)
- [API-SPEC.md](./API-SPEC.md)
- [DEV-COMPLETE-CHECKLIST.md](./DEV-COMPLETE-CHECKLIST.md)

---

## 3. 판정 결과

결과는 아래 셋 중 하나만 선택한다.

| 결과 | 의미 | 후속 조치 |
|------|------|-----------|
| `Accepted` | 스펙 확장이 실질적으로 수용되었다 | `API-SPEC.md`를 실제 인터페이스 문서로 승격 |
| `Accepted with gaps` | 방향은 수용되었으나 일부 계약이 미완료다 | 남은 갭을 별도 TODO로 분리 |
| `Reopen` | 핵심 스펙 확장이 여전히 미수용이다 | 요청서 기준으로 재작업 |

---

## 4. 핵심 판정 질문

아래 6개 질문이 이 문서의 중심이다.

1. 공개 export가 `API-SPEC.md`의 목표 인터페이스와 실질적으로 일치하는가
2. graph 탐색이 이제 라이브러리 소비자에게 고수준 API로 제공되는가
3. `deep`, `graphDepth`, `noCache`는 문서가 아니라 실제 동작으로 확인되는가
4. README / README-ko_kr / 타입 정의 / 구현이 서로 일치하는가
5. 테스트가 새 공개 계약을 보호하는가
6. VSCode 확장이 비공개 내부 경로에 의존하지 않고 공개 API만으로 통합 가능한가

---

## 5. 판정 기준

### 5.1 `Accepted`

아래를 모두 만족해야 한다.

- [ ] 루트 export가 목표 인터페이스와 대체로 일치한다
- [ ] `graph()` 또는 동등한 고수준 공개 API가 존재한다
- [ ] graph 사용에 `PlatformAdapter` 직접 생성이 필요 없다
- [ ] `deep`가 실제 동작에 연결된다
- [ ] `graphDepth`가 실제 동작에 연결되거나 공식적으로 제거되었다
- [ ] `noCache`가 구현과 테스트로 검증되었다
- [ ] CLI 전용 옵션과 라이브러리 옵션 경계가 정리되었다
- [ ] README와 타입 정의가 구현과 일치한다
- [ ] 테스트가 새 공개 계약을 충분히 보호한다
- [ ] `API-SPEC.md`를 실제 사실 문서로 바꿔도 큰 왜곡이 없다

### 5.2 `Accepted with gaps`

아래와 같은 경우이다.

- 고수준 graph API는 들어왔지만 문서가 아직 부정확함
- `deep` 또는 `graphDepth` 중 하나만 실동작으로 연결됨
- export는 정리됐지만 테스트가 부족함
- README 영문/국문 중 한쪽만 업데이트됨

이 경우 남은 갭을 반드시 따로 적는다.

### 5.3 `Reopen`

아래 중 하나라도 해당하면 `Reopen` 가능성이 높다.

- 여전히 graph 사용에 내부 어댑터 지식이 필요함
- `deep`, `graphDepth`, `noCache`가 여전히 feature flag 또는 문구 수준에 머무름
- README가 구현과 다르게 과장되어 있음
- `API-SPEC.md`를 실제 인터페이스 문서로 승격할 수 없음

---

## 6. 리뷰 체크리스트

### 6.1 공개 API

- [ ] `src/index.ts`의 export가 스펙 확장 의도를 반영한다
- [ ] graph 관련 공개 진입점이 충분히 단순하다
- [ ] 라이브러리 사용자가 내부 플랫폼 구현을 알 필요가 없다

### 6.2 동작

- [ ] `trace({ deep: true })`가 기본 trace와 구별되는 실동작을 가진다
- [ ] `trace({ graphDepth: 1 })` 관련 계약이 실제로 지켜진다
- [ ] `trace({ noCache: true })`가 실제 내부 캐시 bypass를 만든다
- [ ] `graph()` 호출 결과가 문서 예시와 맞는다

### 6.3 문서 정합성

- [ ] README 라이브러리 예시가 실제 import/export와 맞다
- [ ] README CLI 예시가 실제 커맨드 구조와 맞다
- [ ] README-ko_kr도 같은 수준으로 정확하다
- [ ] 구현되지 않은 기능을 구현된 것처럼 적지 않았다

### 6.4 테스트 보호 수준

- [ ] 공개 API 테스트가 있다
- [ ] graph 관련 테스트가 있다
- [ ] `deep` 관련 테스트가 있다
- [ ] `graphDepth` 관련 테스트가 있다
- [ ] `noCache` 관련 테스트가 있다

### 6.5 VSCode 확장 통합성

- [ ] 공개 API만으로 `trace`, `health`, `clearCache`, graph 탐색을 구성할 수 있다
- [ ] 확장 코드가 내부 비공개 경로 import 없이 작성 가능하다
- [ ] `API-SPEC.md` 예시를 거의 그대로 사용할 수 있다

---

## 7. 리뷰 출력 형식

리뷰 결과는 아래 형식을 권장한다.

### Findings

- 심각도 순서로 정리
- 구현 누락, 문서 불일치, 테스트 공백을 포함

### Acceptance decision

- `Accepted`, `Accepted with gaps`, `Reopen` 중 하나

### Remaining gaps

- 아직 남은 차이

### API-SPEC update needed

- `예` 또는 `아니오`
- 이유 1~2줄

---

## 8. 복붙용 리뷰 프롬프트

```text
`/Users/Vincent/Workspace/line-lore-vscode/.metadata/LINE-LORE-IMPROVEMENT-REQUEST.md`,
`/Users/Vincent/Workspace/line-lore-vscode/.metadata/API-SPEC.md`,
`/Users/Vincent/Workspace/line-lore-vscode/.metadata/DEV-COMPLETE-CHECKLIST.md`
를 기준으로,
`/Users/Vincent/Workspace/lumy-pack/packages/line-lore` 의 현재 상태를 리뷰해주세요.

목표는 "개발이 끝났는가"가 아니라,
"스펙 확장이 실제로 수용되었는가"를 판정하는 것입니다.

다음 순서로 확인해주세요.
1. 실제 공개 export 확인
2. graph 고수준 API 도입 여부 확인
3. `deep`, `graphDepth`, `noCache` 실동작 확인
4. README / README-ko_kr / 타입 정의 / 구현 정합성 확인
5. 테스트가 새 공개 계약을 보호하는지 확인
6. VSCode 확장이 공개 API만으로 통합 가능한지 확인
7. 결과를 `Accepted`, `Accepted with gaps`, `Reopen` 중 하나로 판정

출력 형식:
- Findings
- Acceptance decision
- Remaining gaps
- API-SPEC update needed
```

---

## 9. 판정 후 문서 처리

### `Accepted`

- `API-SPEC.md`의 가정 문구를 제거한다
- 목표 예시를 실제 반영 인터페이스에 맞게 다듬는다
- 요청서는 완료 상태로 표시한다

### `Accepted with gaps`

- `API-SPEC.md`는 유지하되 미완료 항목을 주의 섹션으로 표시한다
- 남은 차이를 TODO로 분리한다

### `Reopen`

- `API-SPEC.md`는 목표 문서 상태를 유지한다
- 요청서를 기준으로 미수용 항목을 다시 정리한다

이 문서를 기준으로 판단하면, “일단 개발은 끝났음”과 “정말 스펙이 확장되었음”을 구분해서 평가할 수 있다.

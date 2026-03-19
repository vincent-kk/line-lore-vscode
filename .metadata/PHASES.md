# Line Lore — Implementation Phases

## Phase 1: MVP (Core)

**목표**: 기본 trace 기능이 동작하는 최소 확장

| 항목 | 내용 |
|------|------|
| Command Palette에서 `Trace PR` 실행 | `lineLore.tracePR` |
| Context Menu 진입점 | 우클릭 → Trace PR |
| Hover Provider | 라인 호버 시 command link 표시 |
| Information Message 결과 표시 | Open PR / Copy Link |
| StatusBar 로딩 표시 | 스피너 + 완료 메시지 |
| 에러 핸들링 | `LineLoreError` 코드별 분기 |
| Multi-root workspace 지원 | `getWorkspaceFolder()` 기반 |

---

## Phase 2: 상세 표시

| 항목 | 내용 |
|------|------|
| Webview Panel (Stage 2) | 전체 TraceNode 체인 렌더링 |
| Inline Decoration | 라인 끝 "← PR #42" 표시 |
| StatusBar 상시 레벨 표시 | Level 0/1/2 + 클릭 시 health |
| 설정 (Configuration) | hover, decoration, deep trace 옵션 |

---

## Phase 3: 고급 기능

| 항목 | 내용 |
|------|------|
| Range trace | 선택 영역 다중 라인 → 동일 PR 라인은 그룹핑, 상이한 PR은 별도 항목으로 나열. "이 범위가 N개의 PR에서 유래했습니다" 안내 문구 표시. Webview Panel에서 렌더링. |
| Graph 명령 | PR → Issue 그래프 순회 결과를 TreeView로 표시 |
| Health Check 명령 | 운영 레벨 + 업그레이드 가이드 표시 |
| Cache 관리 | 캐시 삭제 명령 + 캐시 상태 표시 |
| Telemetry (선택) | 사용 패턴 수집 (opt-in) |

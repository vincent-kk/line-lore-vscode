# Line Lore — Development Plan

> **핵심 참조**: 라이브러리 API 인터페이스는 [API-SPEC.md](./API-SPEC.md)를 따른다.

## Phase 1: MVP (Core)

### 1.1 프로젝트 기반 구조 생성

- `src/core/lineLoreAdapter.ts` — trace, graph, health, clearCache 래핑 ([API-SPEC.md §2](./API-SPEC.md#2-공개-api))
- `src/core/resultFormatter.ts` — TraceNode[] → 표시용 데이터 변환
- `src/utils/gitDetector.ts` — .git 감지, workspace root 판별
- `src/types.ts` — 확장 내부 타입

### 1.2 Command 구현

- `src/commands/tracePR.ts` — trace 명령 핸들러
- `src/commands/healthCheck.ts` — health 명령 핸들러
- `src/commands/clearCache.ts` — cache clear 핸들러
- `package.json` contributes.commands 등록 (tracePR, healthCheck, clearCache)

### 1.3 Provider 구현

- `src/providers/hoverProvider.ts` — 라인 호버 시 command link 표시
- Context Menu 등록 (`editor/context`, navigation group)

### 1.4 결과 표시 (Stage 1)

- Information Message (Open PR / Copy Link)
- Warning Message (PR 미발견 시 커밋 SHA 표시)
- 에러 핸들링 (`LineLoreError.code`별 분기)

### 1.5 상태 표시

- `src/views/statusBar.ts` — StatusBar 아이템 (스피너, 완료 상태)

### 1.6 활성화 로직

- `src/extension.ts` — activate에서 .git 감지 → 명령/프로바이더 등록
- Multi-root workspace 지원

---

## Phase 2: 상세 표시

### 2.1 Webview Panel (Stage 2)

- `src/views/detailPanel.ts` — Webview Panel 생성/관리
- `media/detail-panel.html` — Webview 템플릿
- TraceNode 체인 렌더링, VSCode 테마 CSS 변수 연동
- Light/Dark/High Contrast 자동 적응

### 2.2 Inline Decoration

- `src/providers/decorationProvider.ts` — "← PR #42" ghost text
- 30초 후 또는 커서 이동 시 자동 제거
- `lineLore.inlineDecoration.enabled` 설정 연동

### 2.3 StatusBar 상시 레벨 표시

- Level 0/1/2 아이콘/색상 표시
- 클릭 시 health check 실행

### 2.4 Configuration 적용

- `vscode.workspace.getConfiguration('lineLore')` 로 설정값 읽기
- `onDidChangeConfiguration` 으로 동적 반영

---

## Phase 3: 고급 기능

### 3.1 Range Trace

- 다중 라인 선택 → PR 그룹핑
- `lineLore.tracePR_range` 명령

### 3.2 Graph 명령

- PR → Issue 그래프 순회 via `graph()` ([API-SPEC.md §4](./API-SPEC.md#4-graph-사용-방식))
- TreeView 렌더링

### 3.3 Cache 관리 UI

- 캐시 상태 표시
- 캐시 삭제 명령

---

## Build

| 명령               | 용도                                 |
| ------------------ | ------------------------------------ |
| `pnpm run compile` | 타입 체크 + 린트 + 빌드 (dev)        |
| `pnpm run package` | 타입 체크 + 린트 + 빌드 (production) |
| `pnpm run watch`   | 개발 시 자동 빌드                    |

## Test

- vitest / @vscode/test-electron
- 단위 테스트: adapter, resultFormatter, gitDetector
- 통합 테스트: command 실행 → 결과 표시 흐름

## Deploy

| 명령                    | 용도             |
| ----------------------- | ---------------- |
| `pnpm run vsce:package` | .vsix 생성       |
| `pnpm run vsce:publish` | Marketplace 배포 |
| GitHub Release 태깅     | 버전 관리        |

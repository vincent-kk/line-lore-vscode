# Line Lore — UX Specification

> **핵심 참조**: 라이브러리 API 인터페이스는 [API-SPEC.md](./API-SPEC.md)를 따른다. 에러 코드별 표시 분기는 [API-SPEC.md §6.3](./API-SPEC.md#63-에러-처리) 참조.

## 1. 진입점 (Entry Points)

### A. Hover Provider (주력)

라인에 마우스를 올리면 Hover 팝업에 command link가 표시된다.
클릭 전까지 API 호출 없음 — 비용 제로.

```
┌──────────────────────────────────────────┐
│  (기존 VSCode/GitLens hover 내용)        │
│  ─────────────────────────────────────── │
│  🔍 Line Lore: Trace PR                 │  ← command link
└──────────────────────────────────────────┘
```

- 다른 HoverProvider(GitLens 등)와 자연스럽게 병합 표시됨
- `isTrusted: true` + `supportThemeIcons: true` 설정 필수

### B. Editor Context Menu (우클릭)

```
┌─────────────────────────────────┐
│  Cut                            │
│  Copy                           │
│  Paste                          │
│  ───────────────────────────    │
│  🔍 Line Lore: Trace PR        │  ← navigation group
│  ───────────────────────────    │
│  Go to Definition               │
└─────────────────────────────────┘
```

- `"group": "navigation"` 으로 Go to Definition 근처에 배치
- 단일 라인 커서 또는 범위 선택 모두 지원

### C. Command Palette

- `Line Lore: Trace PR` — 현재 커서 위치 기준
- `Line Lore: Trace PR (Range)` — 현재 선택 범위 기준
- `Line Lore: Health Check` — 운영 레벨 확인
- `Line Lore: Clear Cache` — 캐시 삭제

### D. 키바인딩

기본 키바인딩은 등록하지 않음. Command만 정의하여 사용자가 Keyboard Shortcuts UI(`Cmd+K Cmd+S`)에서 자유롭게 바인딩 가능.

추천 바인딩 예시 (README에 안내):
| 단축키 예시 | 명령 |
|-------------|------|
| `Ctrl+Shift+L` / `Cmd+Shift+L` | `lineLore.tracePR` |

---

## 2. 결과 표시 (Result Display)

결과 표시는 **2단계**로 구분한다.

### Stage 1: Quick Result (Information Message)

API 호출 직후 즉시 표시. 대부분의 사용 시나리오는 여기서 종료.

```
┌─────────────────────────────────────────────────────┐
│  ℹ PR #42: feat: add authentication                 │
│  [Open PR]  [Copy Link]  [Show Details]             │
└─────────────────────────────────────────────────────┘
```

| 버튼 | 동작 |
|------|------|
| **Open PR** | `vscode.env.openExternal(prUrl)` — 브라우저에서 PR 페이지 열기 |
| **Copy Link** | `vscode.env.clipboard.writeText(prUrl)` — PR URL 클립보드 복사 |
| **Show Details** | Stage 2 Webview Panel 열기 |

### Stage 2: Detail View (Webview Panel)

"Show Details" 클릭 시 사이드 패널에 상세 정보 표시.

```
┌─────────────────────────────────────────┐
│  Line Lore — Trace Result               │
│  ═══════════════════════════════════════ │
│                                          │
│  📄 src/auth.ts : L42                    │
│                                          │
│  ● Commit a1b2c3d [exact]               │
│    via blame-CMw                         │
│    Author: vincent-kk                    │
│    Date: 2025-03-15                      │
│                                          │
│  ▸ PR #42  feat: add authentication     │
│    Merged: 2025-03-15T10:30:00Z          │
│    URL: github.com/org/repo/pull/42      │
│    [Open in Browser]                     │
│                                          │
│  ─── Operating Level ───                 │
│  Level 2 (Full API Access)               │
│                                          │
│  ─── Warnings ───                        │
│  (none)                                  │
└─────────────────────────────────────────┘
```

- `TraceNode[]` 전체를 시각적으로 렌더링
- 노드 유형별 아이콘(●, ○, ◆, ◇, ▸, ▹) 그대로 활용
- Confidence, TrackingMethod 표시
- Cosmetic commit 감지 시 체인 전체 표시
- **VSCode 테마 연동**: `--vscode-editor-background`, `--vscode-editor-foreground` 등 CSS 변수 사용. Light/Dark/High Contrast 테마 자동 적응.

---

## 3. 상태 표시 (Status Indicators)

### StatusBar Item

확장 활성화 시 StatusBar 우측에 상시 표시:

```
$(git-pull-request) Line Lore: L2    ← 정상 (Level 2)
$(warning) Line Lore: L0             ← 제한 모드 (Level 0)
$(sync~spin) Line Lore: Tracing...   ← 조회 중
```

- 클릭 시 `Line Lore: Health Check` 실행
- 운영 레벨에 따라 아이콘/색상 변경

### Inline Decoration (조회 완료 후)

trace 성공 시 해당 라인 끝에 임시 decoration 표시:

```typescript
// 18번 라인 끝에 ghost text 스타일로 표시
return <div className="progress">...</div>    ← PR #42
```

- `vscode.DecorationRenderOptions.after` 사용
- 일정 시간(30초) 후 또는 커서 이동 시 자동 제거
- 설정에서 비활성화 가능

---

## 4. 에러/경고 표시

| 상황 | 표시 방식 |
|------|----------|
| PR 발견 실패 (`PR_NOT_FOUND`) | Warning Message: "No PR found for this line. Commit: a1b2c3d" |
| Level 0 (오프라인) | Warning Message + StatusBar 경고 아이콘 |
| Level 1 (미인증) | Information Message: "Limited mode. Run `gh auth login` for full access." |
| API Rate Limit | Error Message: "GitHub API rate limit reached. Try again later." |
| Git 저장소 아님 | 확장 비활성화 (activation event 불충족) |

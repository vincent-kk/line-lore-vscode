# Line Lore VSCode Extension — 개발의뢰서

## 1. 프로젝트 개요

| 항목 | 내용 |
|------|------|
| **이름** | Line Lore |
| **레포지토리** | `line-lore-vscode` |
| **Marketplace ID** | `lumy-pack.line-lore` |
| **핵심 의존성** | `@lumy-pack/line-lore` (node module) |
| **대상 환경** | VSCode 1.85+ (2024.01~), Node.js >= 20 |
| **라이선스** | MIT |

### 한 줄 요약

에디터에서 코드 라인을 선택하면, 해당 라인이 도입된 Pull Request를 역추적하여 보여주는 VSCode 확장.

### 핵심 가치

- **개발자가 "이 코드 왜 이렇게 됐지?"라는 질문에 3초 안에 답을 얻는다.**
- Git blame → PR → Issue 까지의 계보를 에디터 안에서 완결한다.
- API 호출은 사용자의 명시적 의도(클릭)가 있을 때만 발생한다.

---

## 2. UX 설계

### 2.1 진입점 (Entry Points)

#### A. Hover Provider (주력)

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

#### B. Editor Context Menu (우클릭)

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

#### C. Command Palette

- `Line Lore: Trace PR` — 현재 커서 위치 기준
- `Line Lore: Trace PR (Range)` — 현재 선택 범위 기준
- `Line Lore: Health Check` — 운영 레벨 확인
- `Line Lore: Clear Cache` — 캐시 삭제

#### D. 키바인딩

기본 키바인딩은 등록하지 않음. Command만 정의하여 사용자가 Keyboard Shortcuts UI(`Cmd+K Cmd+S`)에서 자유롭게 바인딩 가능.

추천 바인딩 예시 (README에 안내):
| 단축키 예시 | 명령 |
|-------------|------|
| `Ctrl+Shift+L` / `Cmd+Shift+L` | `lineLore.tracePR` |

### 2.2 결과 표시 (Result Display)

결과 표시는 **2단계**로 구분한다.

#### Stage 1: Quick Result (Information Message)

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

#### Stage 2: Detail View (Webview Panel)

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

### 2.3 상태 표시 (Status Indicators)

#### StatusBar Item

확장 활성화 시 StatusBar 우측에 상시 표시:

```
$(git-pull-request) Line Lore: L2    ← 정상 (Level 2)
$(warning) Line Lore: L0             ← 제한 모드 (Level 0)
$(sync~spin) Line Lore: Tracing...   ← 조회 중
```

- 클릭 시 `Line Lore: Health Check` 실행
- 운영 레벨에 따라 아이콘/색상 변경

#### Inline Decoration (조회 완료 후)

trace 성공 시 해당 라인 끝에 임시 decoration 표시:

```typescript
// 18번 라인 끝에 ghost text 스타일로 표시
return <div className="progress">...</div>    ← PR #42
```

- `vscode.DecorationRenderOptions.after` 사용
- 일정 시간(30초) 후 또는 커서 이동 시 자동 제거
- 설정에서 비활성화 가능

### 2.4 에러/경고 표시

| 상황 | 표시 방식 |
|------|----------|
| PR 발견 실패 (`PR_NOT_FOUND`) | Warning Message: "No PR found for this line. Commit: a1b2c3d" |
| Level 0 (오프라인) | Warning Message + StatusBar 경고 아이콘 |
| Level 1 (미인증) | Information Message: "Limited mode. Run `gh auth login` for full access." |
| API Rate Limit | Error Message: "GitHub API rate limit reached. Try again later." |
| Git 저장소 아님 | 확장 비활성화 (activation event 불충족) |

---

## 3. 기술 아키텍처

### 3.1 확장 활성화

```jsonc
{
  "activationEvents": [
    "onStartupFinished"
  ]
}
```

- `onStartupFinished` 로 지연 로딩 — workspace에 `.git` 디렉토리가 있는지 확인 후 실질적 초기화
- `.git` 없으면 StatusBar 숨김, 명령 비활성화

### 3.2 모듈 구조

```
line-lore-vscode/
├── package.json
├── tsconfig.json
├── src/
│   ├── extension.ts              # activate / deactivate
│   ├── commands/
│   │   ├── tracePR.ts            # trace 명령 핸들러
│   │   ├── healthCheck.ts        # health 명령 핸들러
│   │   └── clearCache.ts         # cache clear 핸들러
│   ├── providers/
│   │   ├── hoverProvider.ts      # HoverProvider 등록
│   │   └── decorationProvider.ts # Inline decoration 관리
│   ├── views/
│   │   ├── statusBar.ts          # StatusBar 아이템 관리
│   │   └── detailPanel.ts        # Webview Panel (Stage 2)
│   ├── core/
│   │   ├── lineLoreAdapter.ts    # @lumy-pack/line-lore 래핑
│   │   └── resultFormatter.ts    # TraceNode[] → 표시용 데이터 변환
│   ├── utils/
│   │   └── gitDetector.ts        # .git 존재 여부 / workspace 루트 감지
│   └── types.ts                  # 확장 내부 타입 정의
├── media/
│   └── detail-panel.html         # Webview 템플릿
├── test/
│   ├── suite/
│   │   ├── tracePR.test.ts
│   │   ├── hoverProvider.test.ts
│   │   └── resultFormatter.test.ts
│   └── runTest.ts
└── .vscodeignore
```

### 3.3 핵심 어댑터: `lineLoreAdapter.ts`

```typescript
import { trace, health, clearCache, type TraceOptions, type TraceFullResult } from '@lumy-pack/line-lore';

export class LineLoreAdapter {
  /**
   * trace()를 호출하되, VSCode 환경에 맞게 cwd를 workspace root로 설정.
   *
   * 핵심: line-lore의 trace()는 내부적으로 child_process로 git을 호출하므로,
   * 정확한 git repository root에서 실행되어야 한다.
   * 절대 경로를 전달하고 line-lore가 git root를 자동 감지하도록 한다.
   *
   * ⚠ 만약 line-lore의 trace()가 process.cwd() 기반으로 동작한다면,
   *   cwd 옵션을 line-lore에 추가하는 것을 검토해야 한다.
   *   (health()에는 이미 cwd 옵션이 존재함)
   */
  async trace(
    filePath: string,
    line: number,
    options?: Partial<TraceOptions>
  ): Promise<TraceFullResult> {
    // 절대 경로 전달 — line-lore가 file 경로에서 git root를 역산
    return trace({
      file: filePath,
      line,
      ...options,
    });
  }

  async health(filePath?: string): Promise<HealthReport> {
    const cwd = filePath
      ? this.getWorkspaceRoot(filePath)
      : vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
    return health({ cwd });
  }

  async clearCache(): Promise<void> {
    return clearCache();
  }

  private getWorkspaceRoot(filePath: string): string {
    const folder = vscode.workspace.getWorkspaceFolder(
      vscode.Uri.file(filePath)
    );
    if (!folder) {
      throw new Error('File is not in any workspace folder');
    }
    return folder.uri.fsPath;
  }
}
```

### 3.4 trace 실행 흐름

```
[User Action: 클릭/우클릭/단축키]
  │
  ├─ 1. 현재 에디터에서 filePath, line 추출
  │
  ├─ 2. StatusBar → "Tracing..." 스피너 표시
  │
  ├─ 3. LineLoreAdapter.trace(filePath, line) 호출
  │     └─ 내부: @lumy-pack/line-lore의 trace() 실행
  │         └─ Blame → AST → Ancestry → PR API
  │
  ├─ 4a. 성공 시:
  │     ├─ PR 노드 존재 → Information Message (Open PR / Copy Link / Show Details)
  │     ├─ PR 노드 없음 → Warning Message (커밋 SHA만 표시)
  │     └─ Inline Decoration 표시 (← PR #42)
  │
  └─ 4b. 실패 시:
        └─ LineLoreError.code에 따라 적절한 에러 메시지 표시
```

### 3.5 Multi-root Workspace 지원

VSCode는 multi-root workspace를 지원하므로, 파일이 속한 workspace folder를 정확히 판별해야 한다.

```typescript
function getWorkspaceRoot(filePath: string): string {
  const workspaceFolder = vscode.workspace.getWorkspaceFolder(
    vscode.Uri.file(filePath)
  );
  if (!workspaceFolder) {
    throw new Error('File is not in any workspace folder');
  }
  return workspaceFolder.uri.fsPath;
}
```

---

## 4. 확장 설정 (Configuration)

`contributes.configuration`으로 사용자 설정 제공:

```jsonc
{
  "lineLore.enabled": {
    "type": "boolean",
    "default": true,
    "description": "Enable/disable Line Lore extension"
  },
  "lineLore.hoverProvider.enabled": {
    "type": "boolean",
    "default": true,
    "description": "Show 'Trace PR' link in hover popup"
  },
  "lineLore.inlineDecoration.enabled": {
    "type": "boolean",
    "default": true,
    "description": "Show PR number inline after trace"
  },
  "lineLore.inlineDecoration.timeout": {
    "type": "number",
    "default": 30,
    "description": "Seconds before inline decoration auto-removes (0 = never)"
  },
  "lineLore.trace.deep": {
    "type": "boolean",
    "default": false,
    "description": "Enable deep trace for squash merges by default"
  },
  "lineLore.trace.noAst": {
    "type": "boolean",
    "default": false,
    "description": "Disable AST analysis"
  },
  "lineLore.trace.noCache": {
    "type": "boolean",
    "default": false,
    "description": "Disable caching"
  }
}
```

---

## 5. 구현 페이즈

### Phase 1: MVP (Core)

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

### Phase 2: 상세 표시

| 항목 | 내용 |
|------|------|
| Webview Panel (Stage 2) | 전체 TraceNode 체인 렌더링 |
| Inline Decoration | 라인 끝 "← PR #42" 표시 |
| StatusBar 상시 레벨 표시 | Level 0/1/2 + 클릭 시 health |
| 설정 (Configuration) | hover, decoration, deep trace 옵션 |

### Phase 3: 고급 기능

| 항목 | 내용 |
|------|------|
| Range trace | 선택 영역 다중 라인 → 동일 PR 라인은 그룹핑, 상이한 PR은 별도 항목으로 나열. "이 범위가 N개의 PR에서 유래했습니다" 안내 문구 표시. Webview Panel에서 렌더링. |
| Graph 명령 | PR → Issue 그래프 순회 결과를 TreeView로 표시 |
| Health Check 명령 | 운영 레벨 + 업그레이드 가이드 표시 |
| Cache 관리 | 캐시 삭제 명령 + 캐시 상태 표시 |
| Telemetry (선택) | 사용 패턴 수집 (opt-in) |

---

## 6. package.json 매니페스트 (Phase 1 기준)

```jsonc
{
  "name": "line-lore",
  "displayName": "Line Lore",
  "description": "Trace any code line back to its origin Pull Request",
  "version": "0.1.0",
  "publisher": "lumy-pack",
  "repository": {
    "type": "git",
    "url": "https://github.com/vincent-kk/line-lore-vscode"
  },
  "engines": {
    "vscode": "^1.85.0"
  },
  "categories": ["Other"],
  "keywords": ["git", "blame", "pull-request", "trace", "pr"],
  "activationEvents": ["onStartupFinished"],
  "main": "./dist/extension.js",
  "capabilities": {
    "untrustedWorkspaces": {
      "supported": false,
      "description": "Line Lore executes git commands and requires a trusted workspace."
    },
    "virtualWorkspaces": {
      "supported": false,
      "description": "Line Lore requires local filesystem and git access."
    }
  },
  "contributes": {
    "commands": [
      {
        "command": "lineLore.tracePR",
        "title": "Line Lore: Trace PR"
      }
    ],
    "menus": {
      "editor/context": [
        {
          "command": "lineLore.tracePR",
          "when": "editorTextFocus && resourceScheme == file",
          "group": "navigation"
        }
      ]
    }
  },
  // bundled dependency — esbuild가 번들에 포함시킴
  "dependencies": {
    "@lumy-pack/line-lore": "^x.x.x"
  },
  "devDependencies": {
    "@types/vscode": "^1.85.0",
    "@vscode/test-electron": "^2.3.0",
    "typescript": "^5.3.0",
    "esbuild": "^0.19.0"
  }
}
```

---

## 7. 빌드 및 번들링

### esbuild 사용

VSCode 확장은 단일 JS 파일로 번들링하는 것이 권장됨.
`@lumy-pack/line-lore`가 내부적으로 `child_process`(git, gh, glab)를 사용하므로
`external`로 Node.js 내장 모듈을 제외해야 함.

```typescript
// esbuild.config.ts
import { build } from 'esbuild';

await build({
  entryPoints: ['src/extension.ts'],
  bundle: true,
  outfile: 'dist/extension.js',
  external: ['vscode'],
  format: 'cjs',
  platform: 'node',
  target: 'node20',
  sourcemap: true,
});
```

---

## 8. 제약 사항 및 고려 사항

### 8.1 `@lumy-pack/line-lore`의 런타임 의존성

line-lore는 내부적으로 `git`, `gh`, `glab` CLI를 `child_process`로 호출한다.
VSCode 확장의 Extension Host는 Node.js 프로세스이므로 `child_process` 사용에 문제 없음.
단, **Web Extension (브라우저 기반 VSCode)** 에서는 동작 불가 — `package.json`의 `capabilities`에 명시 완료 (§6 참조).

### 8.2 API 호출 비용

- Hover 시점에서는 API 호출 없음 (command link만 렌더링)
- trace 실행 시에만 API 호출 발생
- line-lore 내장 캐싱이 중복 호출 방지
- Rate limit 에러는 사용자에게 명시적으로 안내

### 8.3 성능

- trace() 호출은 비동기이며, git blame + API 호출 포함 시 수백ms~수초 소요 가능
- StatusBar 스피너로 진행 상태 표시 필수
- cancellation token 지원 고려 (사용자가 ESC로 취소)

---

## 9. 결정 사항 (Resolved Decisions)

| # | 질문 | 결정 | 비고 |
|---|------|------|------|
| 1 | dependency 전략 | **Bundled dependency** | esbuild로 `@lumy-pack/line-lore`를 확장 번들에 포함. 사용자가 별도 설치할 필요 없음. |
| 2 | Webview 스타일링 | **VSCode 테마 연동** | `--vscode-*` CSS 변수를 사용하여 Light/Dark/High Contrast 테마에 자동 적응. |
| 3 | 키바인딩 | **기본 등록 안 함** | `package.json`의 `commands`에 command만 정의. 사용자가 Keyboard Shortcuts에서 자유롭게 바인딩 가능. |
| 4 | Range trace 표시 | **관계 기반 그룹핑** | 동일 PR에 속하는 라인들은 그룹으로 묶어 표시. 서로 다른 PR이면 별도 항목으로 나열하되, "이 범위가 N개의 서로 다른 PR에서 유래했습니다" 안내 문구 표시. |
| 5 | `cwd` 처리 | **Adapter에서 workspace root 주입** | VSCode 확장 표준 패턴: `vscode.workspace.getWorkspaceFolder(uri).uri.fsPath`를 cwd로 사용하고, file은 해당 root 기준 상대 경로로 변환하여 전달. Multi-root workspace에서도 정확한 git root 보장. |

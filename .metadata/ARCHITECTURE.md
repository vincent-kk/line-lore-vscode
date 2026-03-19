# Line Lore — Technical Architecture

## 1. 확장 활성화

```jsonc
{
  "activationEvents": [
    "onStartupFinished"
  ]
}
```

- `onStartupFinished` 로 지연 로딩 — workspace에 `.git` 디렉토리가 있는지 확인 후 실질적 초기화
- `.git` 없으면 StatusBar 숨김, 명령 비활성화

---

## 2. 모듈 구조

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

---

## 3. 핵심 어댑터: `lineLoreAdapter.ts`

`@lumy-pack/line-lore`의 목표 공개 인터페이스와 개선 요청 배경은 [API-SPEC.md](./API-SPEC.md), [LINE-LORE-IMPROVEMENT-REQUEST.md](./LINE-LORE-IMPROVEMENT-REQUEST.md) 를 함께 참고한다.

```typescript
import { trace, health, clearCache, type TraceOptions, type TraceFullResult } from '@lumy-pack/line-lore';

export class LineLoreAdapter {
  /**
   * trace()를 호출하되, VSCode 환경에 맞게 cwd를 workspace root로 설정.
   *
   * 핵심: line-lore의 trace()는 내부적으로 child_process로 git을 호출하므로,
   * 정확한 git repository root에서 실행되어야 한다.
   * 절대 경로를 전달하고 line-lore가 git root를 자동 감지하도록 한다.
   */
  async trace(
    filePath: string,
    line: number,
    options?: Partial<TraceOptions>
  ): Promise<TraceFullResult> {
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

---

## 4. trace 실행 흐름

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

---

## 5. Multi-root Workspace 지원

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

## 6. 빌드 및 번들링

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

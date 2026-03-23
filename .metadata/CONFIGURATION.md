# Line Lore — Configuration & Manifest

> **핵심 참조**: 설정 항목은 [API-SPEC.md](./API-SPEC.md)의 `TraceOptions` 필드와 대응한다.

## 1. 확장 설정 (contributes.configuration)

```jsonc
{
  "lineLore.enabled": {
    "type": "boolean",
    "default": true,
    "description": "Enable/disable Line Lore extension",
  },
  "lineLore.hoverProvider.enabled": {
    "type": "boolean",
    "default": true,
    "description": "Show 'Trace PR' link in hover popup",
  },
  "lineLore.inlineDecoration.enabled": {
    "type": "boolean",
    "default": true,
    "description": "Show PR number inline after trace",
  },
  "lineLore.inlineDecoration.timeout": {
    "type": "number",
    "default": 30,
    "description": "Seconds before inline decoration auto-removes (0 = never)",
  },
  "lineLore.trace.deep": {
    "type": "boolean",
    "default": false,
    "description": "Enable deep trace for squash merges by default",
  },
  "lineLore.trace.noAst": {
    "type": "boolean",
    "default": false,
    "description": "Disable AST analysis",
  },
  "lineLore.trace.noCache": {
    "type": "boolean",
    "default": false,
    "description": "Disable caching",
  },
}
```

---

## 2. package.json 매니페스트 (Phase 1 기준)

```jsonc
{
  "name": "line-lore",
  "displayName": "Line Lore",
  "description": "Trace any code line back to its origin Pull Request",
  "version": "0.1.0",
  "publisher": "lumy-pack",
  "repository": {
    "type": "git",
    "url": "https://github.com/vincent-kk/line-lore-vscode",
  },
  "engines": {
    "vscode": "^1.85.0",
  },
  "categories": ["Other"],
  "keywords": ["git", "blame", "pull-request", "trace", "pr"],
  "activationEvents": ["onStartupFinished"],
  "main": "./dist/extension.js",
  "capabilities": {
    "untrustedWorkspaces": {
      "supported": false,
      "description": "Line Lore executes git commands and requires a trusted workspace.",
    },
    "virtualWorkspaces": {
      "supported": false,
      "description": "Line Lore requires local filesystem and git access.",
    },
  },
  "contributes": {
    "commands": [
      {
        "command": "lineLore.tracePR",
        "title": "Line Lore: Trace PR",
      },
    ],
    "menus": {
      "editor/context": [
        {
          "command": "lineLore.tracePR",
          "when": "editorTextFocus && resourceScheme == file",
          "group": "navigation",
        },
      ],
    },
  },
  "dependencies": {
    "@lumy-pack/line-lore": "^x.x.x",
  },
  "devDependencies": {
    "@types/vscode": "^1.85.0",
    "@vscode/test-electron": "^2.3.0",
    "typescript": "^5.3.0",
    "esbuild": "^0.19.0",
  },
}
```

# Line Lore

**Trace any code line back to its origin Pull Request** — right from your editor.

Line Lore answers the question *"Why is this code here?"* in 3 seconds. Select a line, trace it back through git blame, and see the PR that introduced it — without leaving VSCode.

## Features

### Trace PR
Right-click any line or use the Command Palette to trace it back to its origin Pull Request.

- **Information Message** with PR title, "Open PR" and "Copy Link" buttons
- **Show Details** opens a Webview panel with the full trace chain
- **Inline Decoration** shows `← PR #42` ghost text next to the traced line

### Range Trace
Select multiple lines and trace the entire range at once.

### Graph Explore
Enter a PR number to explore linked issues via the platform API.

### Health Check
Check your operating level and platform integration status.

| Level | Meaning | Capabilities |
|-------|---------|-------------|
| 0 | Git only | Commit-level tracing |
| 1 | CLI detected, limited auth | Basic PR identification |
| 2 | Fully authenticated | Full PR/Issue metadata |

### StatusBar
Persistent operating level indicator in the status bar. Click to run Health Check.

## Usage

1. Open a file in a Git repository
2. Place your cursor on a line
3. Run **Line Lore: Trace PR** from:
   - Command Palette (`Cmd+Shift+P` / `Ctrl+Shift+P`)
   - Right-click context menu
   - Hover tooltip link

## Commands

| Command | Description |
|---------|-------------|
| `Line Lore: Trace PR` | Trace current line to its origin PR |
| `Line Lore: Trace PR (Range)` | Trace selected line range |
| `Line Lore: Explore Graph` | Explore PR → Issue graph |
| `Line Lore: Health Check` | Check operating level and platform status |
| `Line Lore: Clear Cache` | Clear cached trace data |

## Settings

| Setting | Default | Description |
|---------|---------|-------------|
| `lineLore.enabled` | `true` | Enable/disable the extension |
| `lineLore.hoverProvider.enabled` | `true` | Show trace link in hover popup |
| `lineLore.inlineDecoration.enabled` | `true` | Show PR number inline after trace |
| `lineLore.inlineDecoration.timeout` | `30` | Seconds before decoration auto-removes (0 = never) |
| `lineLore.trace.deep` | `false` | Enable deep trace for squash merges |
| `lineLore.trace.noAst` | `false` | Disable AST analysis |
| `lineLore.trace.noCache` | `false` | Disable caching |

## Requirements

- VSCode 1.85+
- Git repository (local filesystem, not virtual/remote workspaces)
- For full features (Level 2): GitHub CLI (`gh`) or GitLab CLI (`glab`) authenticated

## Keyboard Shortcuts

No default keybindings are registered. Bind them yourself via `Cmd+K Cmd+S`:

| Suggested Shortcut | Command |
|-------------------|---------|
| `Cmd+Shift+L` / `Ctrl+Shift+L` | `lineLore.tracePR` |

## License

MIT

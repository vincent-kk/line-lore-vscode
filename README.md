# Line Lore

**Trace any code line back to its origin Pull Request** — right from your editor.

Line Lore answers the question _"Why is this code here?"_ in 3 seconds. Place your cursor on a line, trace it through git blame, and discover the PR that introduced it — without leaving VSCode.

## Installation

Line Lore is not yet published to the VSCode Marketplace. Install manually via `.vsix`:

1. Download the latest `.vsix` from [GitHub Releases](https://github.com/vincent-kk/line-lore-vscode/releases)
2. Install in VSCode:
   - **Via Command Palette**: `Cmd+Shift+P` (macOS) / `Ctrl+Shift+P` (Windows/Linux) → `Extensions: Install from VSIX...` → select the downloaded file
   - **Via CLI**: `code --install-extension line-lore-<version>.vsix`
3. Reload VSCode when prompted

## Features

### Trace PR

Right-click any line or use the Command Palette to trace it back to its origin Pull Request.

- **Information Message** with PR title, "Open PR" and "Copy Link" buttons
- **Show Details** opens a side panel with the full trace chain (commit → merge → PR → issue)
- **Inline Decoration** shows `← PR #42` ghost text next to the traced line

### Two Trace Modes

| Mode | Description |
| --- | --- |
| **Change** (default) | Traces to the PR that last modified the line |
| **Origin** | Follows rename/move history to the original PR that created the code |

Both modes are accessible from the hover tooltip after an initial trace.

### Hover Tooltip

After a line has been traced, hovering past the end of the line shows a rich tooltip with:

- PR number and title with a direct link
- Action buttons: **Copy Link**, **Show Details**
- Trace buttons: **Re-trace**, **Origin**
- When both Change and Origin results are cached, the tooltip shows both with a comparison

### Range Trace

Select multiple lines and trace the entire range at once.

### Graph Explore

Enter a PR number to explore linked issues via the platform API.

### Health Check

Check your operating level and platform integration status.

| Level | Condition | Capabilities |
| --- | --- | --- |
| 0 | Git only | Commit-level tracing |
| 1 | CLI detected, limited auth | Basic PR identification |
| 2 | Fully authenticated | Full PR/Issue metadata |

### Status Bar

Persistent operating level indicator in the bottom status bar. Click to run Health Check.

### Detail Panel

A webview side panel that renders the full trace chain:

- **Original Commit** → **Cosmetic Commit** → **Merge Commit** → **Pull Request** → **Issue**
- Shows confidence level, tracking method, merge date, and linked URLs
- Fully themed using VSCode color variables

## Usage

1. Open a file in a Git repository
2. Place your cursor on a line
3. Run **Line Lore: Trace PR** from:
   - Command Palette (`Cmd+Shift+P` / `Ctrl+Shift+P`)
   - Right-click context menu
   - Hover tooltip link (after end of line text)

## Commands

| Command | Description |
| --- | --- |
| `Line Lore: Trace PR` | Trace current line to its origin PR |
| `Line Lore: Trace PR (Range)` | Trace selected line range |
| `Line Lore: Explore Graph` | Explore PR → Issue graph |
| `Line Lore: Health Check` | Check operating level and platform status |
| `Line Lore: Clear Cache` | Clear cached trace data |

## Settings

| Setting | Default | Description |
| --- | --- | --- |
| `lineLore.enabled` | `true` | Enable/disable the extension |
| `lineLore.hoverProvider.enabled` | `true` | Show trace info in hover tooltip |
| `lineLore.inlineDecoration.enabled` | `true` | Show PR number inline after trace |
| `lineLore.inlineDecoration.timeout` | `30` | Seconds before decoration auto-removes (0 = never) |
| `lineLore.trace.deep` | `false` | Enable deep trace for squash merges |
| `lineLore.trace.noAst` | `false` | Disable AST analysis |
| `lineLore.trace.noCache` | `false` | Disable caching |

## Requirements

- VSCode 1.85+
- Git repository (local filesystem only — virtual/remote workspaces are not supported)
- **Level 1+**: [GitHub CLI](https://cli.github.com/) (`gh`) or [GitLab CLI](https://gitlab.com/gitlab-org/cli) (`glab`) installed
- **Level 2**: CLI authenticated (`gh auth login` / `glab auth login`)

## Keyboard Shortcuts

No default keybindings are registered. Bind them yourself via `Cmd+K Cmd+S` (macOS) / `Ctrl+K Ctrl+S` (Windows/Linux):

| Suggested Shortcut | Command |
| --- | --- |
| `Cmd+Shift+L` / `Ctrl+Shift+L` | `lineLore.tracePR` |

## Supported Platforms

| Platform | CLI | Status |
| --- | --- | --- |
| GitHub | `gh` | Supported |
| GitLab | `glab` | Supported |

## License

MIT

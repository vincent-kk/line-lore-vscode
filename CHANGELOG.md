# Changelog

## [1.0.0] - 2026-03-27

Initial public release as **PR Tracer**.

### Features

- **Trace PR**: Trace any code line back to its origin Pull Request via git blame
- **Trace PR (Range)**: Trace selected line ranges with aggregate results
- **Origin Trace Mode**: Follow rename/move history to find the original PR that created the code
- **Hover Tooltip**: Rich hover past end-of-line with PR info, Copy Link, Show Details, Re-trace, and Origin buttons; dual-mode display when both Change and Origin results are cached
- **Inline CodeLens**: `PR #N: title` decoration above traced lines with Show Details and Dismiss actions
- **Graph Explore**: Enter a PR number to explore linked issues via platform API
- **Health Check**: 3-tier operating level diagnostics (L0: Git only, L1: CLI detected, L2: Full API access)
- **Status Bar**: Persistent operating level indicator with click-to-check; transient loading/result/error states
- **Detail Panel**: Webview side panel rendering full trace chain (Commit → Merge → PR → Issue) with VSCode theme support
- **Dynamic Configuration**: Hover provider and inline decorations toggle without extension reload
- **3-Tier Error Handling**: All 24 error codes mapped to actionable user messages
- **Multi-root Workspace**: Correct workspace folder resolution per file
- **Platform Support**: GitHub (`gh`) and GitLab (`glab`) CLI integration

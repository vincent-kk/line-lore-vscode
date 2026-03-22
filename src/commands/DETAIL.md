## Requirements

- Register commands: tracePR, tracePRRange, healthCheck, clearCache, graphExplore, copyPrLink, showDetails, traceFromHover
- All commands use LineLoreAdapter from core/ (no direct library access)
- Show loading spinner via StatusBarController during async operations
- Display results via vscode.window Information/Warning/Error messages
- tracePRRange falls back to single-line when no selection exists
- traceFromHover: receives (filePath, line) from hover command URI, traces and shows result via DecorationController (primary) + hover re-trigger (best-effort)

## API Contracts

- `registerCommands(context, adapter, statusBar, detailPanel?, decoration?)`: void
- All commands registered as `lineLore.{commandName}`
- tracePR: reads cursor line, shows PR info or commit SHA warning
- tracePRRange: reads selection range, passes endLine to adapter
- traceFromHover: receives filePath/line from hover fallback URI, calls adapter.trace, shows decoration as primary feedback, fires editor.action.showHover as best-effort
- healthCheck: shows operating level and guidance
- clearCache: clears cache and shows confirmation
- DecorationController injected via registerCommands 5th parameter from extension.ts

## Last Updated

2026-03-23

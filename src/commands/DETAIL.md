## Requirements

- Register commands: tracePR, tracePRRange, healthCheck, clearCache, graphExplore, copyPrLink, showDetails, traceFromHover
- All commands use LineLoreAdapter from core/ (no direct library access)
- Show loading spinner via StatusBarController during async operations
- Display results via vscode.window Information/Warning/Error messages
- tracePRRange falls back to single-line when no selection exists
- traceFromHover: receives (filePath, line) from hover command URI, traces and shows result via DecorationController (primary feedback with hoverMessage)

## API Contracts

- `registerCommands(context, adapter, statusBar, detailPanel?, decoration?)`: void
- All commands registered as `lineLore.{commandName}`
- tracePR: reads cursor line, shows PR info or commit SHA warning
- tracePRRange: reads selection range, passes endLine to adapter
- traceFromHover: receives filePath/line from decoration fallback hover, calls adapter.trace, shows rich decoration with hoverMessage as primary feedback, shows warning message if no PR found
- healthCheck: shows operating level and guidance
- clearCache: clears cache and shows confirmation
- DecorationController injected via registerCommands 5th parameter from extension.ts

## Last Updated

2026-03-26

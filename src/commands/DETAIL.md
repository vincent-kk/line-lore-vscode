## Requirements

- Register 4 commands: tracePR, tracePRRange, healthCheck, clearCache
- All commands use LineLoreAdapter from core/ (no direct library access)
- Show loading spinner via StatusBarController during async operations
- Display results via vscode.window Information/Warning/Error messages
- tracePRRange falls back to single-line when no selection exists

## API Contracts

- `registerCommands(context, adapter, statusBar)`: void
- All commands registered as `lineLore.{commandName}`
- tracePR: reads cursor line, shows PR info or commit SHA warning
- tracePRRange: reads selection range, passes endLine to adapter
- healthCheck: shows operating level and guidance
- clearCache: clears cache and shows confirmation

## Last Updated

2026-03-22

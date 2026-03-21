## Requirements

- Manage single StatusBarItem lifecycle (create/show/hide/dispose)
- Show spinner during trace operations
- Show transient result/error for 5 seconds then auto-hide (Phase 1)
- Click triggers healthCheck command

## API Contracts

- `StatusBarController.create()`: void
- `StatusBarController.showLoading()`: void
- `StatusBarController.showResult(level: OperatingLevel)`: void (5s display)
- `StatusBarController.showError(message: string)`: void (5s display)
- `StatusBarController.hide()`: void
- `StatusBarController.dispose()`: void

## Last Updated

2026-03-22

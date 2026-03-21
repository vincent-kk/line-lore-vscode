## Requirements

- Manage single StatusBarItem lifecycle (create/show/hide/dispose)
- Show spinner during trace operations
- Show persistent level after activation; transient result/error for 5s then return to persistent
- Click triggers healthCheck command
- DetailPanelManager renders full TraceNode[] chain in Webview Panel
- Webview uses VSCode CSS variables for Light/Dark/High Contrast theme adaptation

## API Contracts

- `StatusBarController.create()`: void
- `StatusBarController.showLoading()`: void
- `StatusBarController.showResult(level: OperatingLevel)`: void (5s transient)
- `StatusBarController.showPersistentLevel(level: OperatingLevel)`: void (permanent)
- `StatusBarController.showError(message: string)`: void (5s transient)
- `StatusBarController.hide()`: void
- `StatusBarController.dispose()`: void
- `DetailPanelManager.show(filePath, line, result)`: void
- `DetailPanelManager.dispose()`: void

## Last Updated

2026-03-22

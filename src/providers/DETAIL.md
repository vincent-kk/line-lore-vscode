## Requirements

- Register HoverProvider for all file types with dynamic enable/disable
- Display command link only (no API calls on hover)
- Respect lineLore.hoverProvider.enabled configuration dynamically
- DecorationController shows inline "← PR #N" ghost text after trace
- Decoration auto-removes after configurable timeout or cursor move
- Respect lineLore.inlineDecoration.enabled configuration

## API Contracts

- `registerProviders(context)`: void — creates ProviderManager and registers
- `ProviderManager.register(context)`: void — sets up hover + config listener
- `LineLoreHoverProvider.provideHover()`: MarkdownString with command link
- `DecorationController.showDecoration(editor, line, prNumber)`: void
- `DecorationController.clear()`: void
- `DecorationController.dispose()`: void

## Last Updated

2026-03-22

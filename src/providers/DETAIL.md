## Requirements

- Register HoverProvider for all file types
- Display command link only (no API calls on hover)
- Respect lineLore.hoverProvider.enabled configuration

## API Contracts

- `registerProviders(context)`: void
- `LineLoreHoverProvider.provideHover()` returns MarkdownString with command link
- MarkdownString has isTrusted=true and supportThemeIcons=true

## Last Updated

2026-03-22

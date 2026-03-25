## Requirements

- DecorationController shows clickable CodeLens above the traced line with PR link
- CodeLens displays `$(git-pull-request) PR #N: title` and opens PR URL on click
- CodeLens auto-removes after configurable timeout or cursor move
- Respect lineLore.hoverProvider.enabled for hover provider registration
- Respect lineLore.inlineDecoration.enabled for CodeLens display
- ProviderManager manages hover provider lifecycle and config changes
- Hover provider restricted to file scheme only (no output panels, git diff views)
- HoverProvider uses cache-only reads (no network calls during hover)

## API Contracts

- `registerProviders(context, adapter)`: void — creates ProviderManager and registers
- `ProviderManager(adapter)`: constructor with adapter dependency
- `ProviderManager.register(context)`: void — sets up hover provider + config listener
- `DecorationController` implements `CodeLensProvider` — registered for `{ scheme: 'file' }`
- `DecorationController.showDecoration(editor, line, prNumber, prUrl, prTitle?)`: void — shows CodeLens
- `DecorationController.provideCodeLenses(document)`: CodeLens[] — returns active CodeLens
- `DecorationController.clear()`: void — removes CodeLens
- `DecorationController.dispose()`: void — disposes registration and event emitter
- `formatHoverMarkdown(display, filePath, line)`: MarkdownString with PR info and command URIs

## Last Updated

2026-03-26

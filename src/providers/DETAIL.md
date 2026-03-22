## Requirements

- Register HoverProvider for all file types with dynamic enable/disable
- HoverProvider checks cache via adapter.traceCached() on hover
- Cache hit with PR: display rich hover (PR link, copy, details, re-trace)
- Cache miss or error: display static "Trace PR" command link (fallback)
- Respect CancellationToken via Promise.race to abort stale hovers
- Respect lineLore.hoverProvider.enabled configuration dynamically
- DecorationController shows inline "← PR #N" ghost text after trace
- Decoration auto-removes after configurable timeout or cursor move
- Respect lineLore.inlineDecoration.enabled configuration

## API Contracts

- `registerProviders(context, adapter)`: void — creates ProviderManager and registers
- `ProviderManager(adapter)`: constructor with adapter dependency
- `ProviderManager.register(context)`: void — sets up hover + config listener
- `LineLoreHoverProvider(adapter)`: constructor with adapter dependency
- `LineLoreHoverProvider.provideHover(doc, pos, token)`: Promise<Hover | undefined>
- `formatHoverMarkdown(display, filePath, line)`: MarkdownString with PR info and command URIs
- `DecorationController.showDecoration(editor, line, prNumber)`: void
- `DecorationController.clear()`: void
- `DecorationController.dispose()`: void

## Last Updated

2026-03-22

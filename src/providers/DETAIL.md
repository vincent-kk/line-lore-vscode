## Requirements

- Register HoverProvider for all file types with dynamic enable/disable
- HoverProvider checks cache via adapter.traceCached() on hover
- Cache hit with PR: display rich hover (PR link, copy, details, re-trace with encoded args)
- Cache miss or error: display static "Trace PR" fallback link → invokes lineLore.traceFromHover with [filePath, line] args
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

## Hover Fallback → traceFromHover Flow

1. User hovers on uncached line → provideHover returns fallback with `command:lineLore.traceFromHover?[filePath, line]`
2. User clicks → traceFromHover command executes: statusBar loading → adapter.trace → cache populated
3. Primary feedback: DecorationController shows `← PR #N` inline (always succeeds)
4. Secondary feedback: editor.action.showHover re-triggered (best-effort, works if cursor hasn't moved)
5. Re-trace button in rich hover also invokes traceFromHover with same flow

## Last Updated

2026-03-23

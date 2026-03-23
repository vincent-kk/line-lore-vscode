## Requirements

- DecorationController shows inline "← PR #N" ghost text after trace with rich hover via hoverMessage
- DecorationController shows cursor-line fallback decoration with "Trace PR" command link hover
- Decoration auto-removes after configurable timeout or cursor move (rich decoration only)
- Fallback decoration moves with cursor and checks cache before showing
- Respect lineLore.hoverProvider.enabled for decoration-based hover
- Respect lineLore.inlineDecoration.enabled for rich decoration display
- ProviderManager manages cursor-line fallback lifecycle and config changes

## API Contracts

- `registerProviders(context, adapter, decoration)`: void — creates ProviderManager and registers
- `ProviderManager(adapter, decoration)`: constructor with adapter and DecorationController dependencies
- `ProviderManager.register(context)`: void — sets up fallback listener + config listener
- `DecorationController.showDecoration(editor, line, prNumber, hoverMessage?)`: void — shows rich decoration with optional hover
- `DecorationController.showFallback(editor, line)`: void — shows fallback decoration with Trace PR command hover
- `DecorationController.clearFallback()`: void — clears fallback decoration only
- `DecorationController.clear()`: void — clears rich decoration only
- `DecorationController.dispose()`: void — disposes both decoration types
- `formatHoverMarkdown(display, filePath, line)`: MarkdownString with PR info and command URIs

## Cursor-Line Fallback Flow

1. User places cursor on a line → ProviderManager checks cache via adapter.traceCached
2. Cache miss → DecorationController.showFallback shows `···` with "Trace PR" hover
3. User hovers over `···` → sees `$(search) [Line Lore: Trace PR](command:lineLore.traceFromHover?[filePath, line])`
4. User clicks → traceFromHover command executes: adapter.trace → cache populated → showDecoration with rich hover
5. Cache hit → fallback cleared (no decoration shown, cache already has data)

## Last Updated

2026-03-23

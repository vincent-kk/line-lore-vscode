# providers -- VSCode UI Providers

Implements decoration-based hover and inline PR annotations.

## Public API

- `registerProviders(context, adapter, decoration)` -- registers providers and cursor-line fallback
- `DecorationController` -- manages inline `← PR #N` decorations with hover and cursor-line fallback
- `formatHoverMarkdown(display, filePath, line)` -- formats PR info as MarkdownString for decoration hover

## Always do

- Put registration logic in register.ts (not index.ts)
- Check config settings before registering providers
- Set isTrusted and supportThemeIcons on MarkdownString
- Use DecorationOptions.hoverMessage for hover content (not HoverProvider)

## Ask first

- Adding new provider types
- Changing hover popup content format

## Never do

- Make network or git calls during hover; local cache-only reads are permitted
- Import from commands/ directly; use command IDs as strings
- Register providers that ignore user configuration
- Perform API or network calls during hover (git blame is local and permitted)

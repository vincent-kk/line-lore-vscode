# providers -- VSCode UI Providers

Implements HoverProvider and future provider registrations.

## Public API

- `registerProviders(context, adapter, detailPanel?)` -- registers all providers

## Always do

- Put registration logic in register.ts (not index.ts)
- Check config settings before registering providers
- Set isTrusted and supportThemeIcons on MarkdownString
- Use CancellationToken to abort cache reads when hover is dismissed

## Ask first

- Adding new provider types (decorationProvider is Phase 2)
- Changing hover popup content format

## Never do

- Make network or git calls during hover; local cache-only reads are permitted
- Import from commands/ directly; use command IDs as strings
- Register providers that ignore user configuration

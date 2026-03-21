# providers -- VSCode UI Providers

Implements HoverProvider and future provider registrations.

## Public API

- `registerProviders(context)` -- registers all providers, returns disposables

## Always do

- Put registration logic in register.ts (not index.ts)
- Check config settings before registering providers
- Set isTrusted and supportThemeIcons on MarkdownString
- Return command links only; never make API calls in providers

## Ask first

- Adding new provider types (decorationProvider is Phase 2)
- Changing hover popup content format

## Never do

- Make API calls during hover (zero-cost until click)
- Import from commands/ directly; use command IDs as strings
- Register providers that ignore user configuration

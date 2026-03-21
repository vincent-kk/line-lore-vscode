# commands -- VSCode Command Handlers

Registers and implements all Line Lore commands for the Command Palette and keybindings.

## Public API

- `registerCommands(context, adapter, statusBar, detailPanel?, decoration?)` -- registers all commands

## Always do

- Register commands via vscode.commands.registerCommand in register.ts
- Add all disposables to context.subscriptions
- Use StatusBarController for loading/result/error states during execution

## Ask first

- Adding new commands (coordinate with package.json contributes)
- Changing command IDs (breaking change for keybindings)

## Never do

- Call @lumy-pack/line-lore directly; use LineLoreAdapter from core/
- Put registration logic in index.ts (keep it a pure barrel)
- Block the extension host with synchronous operations
- Swallow errors silently; always show user-facing message

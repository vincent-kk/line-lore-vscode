# src — Extension Source Root

Entry point for the PR Tracer VSCode extension.

## Public API

- `activate(context: ExtensionContext)` — Extension activation entry point
- `deactivate()` — Extension cleanup entry point

## Always do

- Export activate/deactivate from extension.ts as the VSCode extension contract
- Place all extension source code under this directory
- Use esbuild to bundle src/ into dist/extension.js

## Ask first

- Adding new top-level directories under src/ (commands/, providers/, etc.)
- Changing the activation event strategy
- Adding new VSCode API surface dependencies

## Never do

- Import from dist/ or out/ directories
- Place runtime code outside src/
- Import vscode module in files intended for unit testing without mocking
- Exceed 50 lines in this INTENT.md — restructure the module instead

Note: extension.ts is allowed as a peer file per .filid/config.json exception.

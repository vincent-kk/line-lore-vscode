# core -- Library Adapter Layer

Wraps @lumy-pack/line-lore public API for VSCode extension use.

## Public API

- `PrTracerAdapter` -- trace(), health(), clearCache() with workspace-aware config merge
- `formatTraceResult()` -- TraceFullResult to DisplayResult conversion
- `formatErrorMessage()` -- LineLoreError code to user-facing ErrorInfo via 3-tier strategy (24 codes)

## Always do

- Route all @lumy-pack/line-lore calls through PrTracerAdapter
- Handle all 24 LineLoreErrorCode values via 3-tier strategy
- Import LineLoreErrorCode const object for comparisons (no string literals)

## Ask first

- Adding new library function wrappers (e.g., traverseIssueGraph() is Phase 3)
- Changing the error code to message mapping

## Never do

- Import @lumy-pack/line-lore outside this module
- Import vscode namespace in resultFormatter (keep it unit-testable)
- Expose raw library types to consumers; use extension internal types

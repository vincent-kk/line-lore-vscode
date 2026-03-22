## Requirements

- Wrap all @lumy-pack/line-lore public API calls (trace, health, clearCache)
- Provide workspace-aware configuration merge for trace options (deep, noAst, noCache)
- Map all 24 LineLoreErrorCode values to user-facing messages via 3-tier strategy
- Format TraceFullResult into DisplayResult for UI consumption
- Treat PR_NOT_FOUND as a valid non-error result (warning, not thrown error)

## API Contracts

- `LineLoreAdapter.trace(filePath, line, endLine?, overrides?)`: Promise<TraceFullResult>
- `LineLoreAdapter.traceCached(filePath, line)`: Promise<TraceFullResult> — cache-only trace, no network/git calls; returns empty nodes on cache miss
- `LineLoreAdapter.health(cwd?)`: Promise<HealthReport & { operatingLevel }>
- `LineLoreAdapter.clearCache()`: Promise<void>
- `formatTraceResult(result)`: DisplayResult
- `formatErrorMessage(code)`: ErrorInfo

## Last Updated

2026-03-22

# Changelog

## [0.1.5] - 2026-03-26

### Added

### Changed

### Fixed


## [0.1.4] - 2026-03-24

### Added

- Uncommitted line detection using `isUncommittedLine` utility (git zero-hash check)
- Informational message ("This line has not been committed yet.") when tracing an uncommitted line
- Hover provider returns `undefined` for uncommitted lines instead of showing misleading "Trace PR" link
- Unit tests for uncommitted line utility, hover provider, and trace helpers

### Changed

- `.vscodeignore` updated to exclude `.yarn/` directory from packaged extension
- `vsce` commands now use `--no-yarn` flag to prevent Yarn-related packaging issues

### Fixed

- Tracing an uncommitted line no longer shows a confusing "No PR found" warning — now clearly indicates the line hasn't been committed

## [0.1.3] - 2026-03-24

### Fixed

- PR titles containing markdown special characters (`[]()\\`) are now properly escaped in hover tooltips
- Added `escapeMarkdownLinkText` function to prevent broken links when PR titles include brackets or parentheses

## [0.1.2] - 2026-03-24

### Added

- **Origin trace mode**: follow rename/move history to find the original PR that created the code
- `Trace Origin From Hover` command accessible via hover tooltip
- Dual-mode hover display: shows both Change and Origin results when cached, with comparison
- `Copy PR Link` and `Show Details` commands accessible from hover tooltip action buttons
- Prettier configuration for consistent code formatting
- Hover provider restricted to right-side of code only (past end of line text) to avoid interfering with IntelliSense

### Changed

- Hover markdown restructured with 4 scenarios (A: change only, B: origin only, C: both different, D: both same)
- `LineLoreAdapter` extended with `traceCached()` method for cache-only reads during hover
- Command registration refactored to support new internal commands
- Detail panel rendering updated with improved HTML structure and theme support

## [0.1.1] - 2026-03-23

### Added

- `traceFromHover` command for triggering trace directly from hover tooltip link
- `copyPrLink` and `showDetails` internal commands
- Extension icon
- Version bump script (`scripts/version.sh`) with patch/minor/major support
- Comprehensive unit test suite (18 test files)

### Changed

- Upgraded `@lumy-pack/line-lore` from 0.0.5 to 0.0.7
- Simplified PR tracing logic and improved multi-root workspace folder detection
- Refactored command handling for better separation of concerns
- Hover markdown formatting improvements

## [0.1.0] - 2026-03-22

### Added

- **Trace PR**: Trace any code line back to its origin Pull Request via git blame
- **Trace PR (Range)**: Trace selected line ranges with range display in detail panel
- **Explore Graph**: PR-to-Issue graph exploration via platform API
- **Health Check**: Operating level display with platform integration diagnostics
- **Clear Cache**: Cache management with confirmation dialog
- **Hover Provider**: Zero-cost "Trace PR" command link on line hover
- **Inline Decoration**: `← PR #42` ghost text after successful trace (30s auto-remove)
- **Webview Detail Panel**: Full TraceNode chain rendering with VSCode theme support
- **StatusBar**: Persistent operating level indicator with transient trace status
- **Dynamic Configuration**: Hover provider registers/unregisters without extension reload
- **3-Tier Error Handling**: All 24 error codes mapped to actionable user messages
- **Multi-root Workspace**: Correct workspace folder resolution per file

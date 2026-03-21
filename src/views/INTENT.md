# views -- VSCode UI Components

StatusBar, and future Webview Panel management.

## Public API

- `StatusBarController` -- manages StatusBar item lifecycle and state transitions

## Always do

- Dispose StatusBar item in deactivate (including pending timers)
- Show spinner during async operations
- Use VSCode theme-compatible icons (codicons)
- Auto-hide transient displays after 5 seconds (Phase 1)

## Ask first

- Adding new view types (detailPanel is Phase 2)
- Changing StatusBar alignment or priority
- Changing display duration from 5 seconds

## Never do

- Make API calls from view components; views are passive display only
- Create multiple StatusBar items (single item, multiple states)
- Use hardcoded colors; rely on VSCode theme API

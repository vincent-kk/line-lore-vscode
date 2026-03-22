#!/usr/bin/env bash
set -euo pipefail

# ─── Configuration ───────────────────────────────────────────
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
PACKAGE_JSON="$PROJECT_ROOT/package.json"
CHANGELOG="$PROJECT_ROOT/CHANGELOG.md"
PLUGIN_PKG="@lumy-pack/line-lore"

# ─── Color helpers ───────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
CYAN='\033[0;36m'
NC='\033[0m'

info()  { echo -e "${CYAN}[info]${NC} $*"; }
ok()    { echo -e "${GREEN}[ok]${NC} $*"; }
warn()  { echo -e "${YELLOW}[warn]${NC} $*"; }
err()   { echo -e "${RED}[error]${NC} $*" >&2; }

# ─── Usage ───────────────────────────────────────────────────
usage() {
  cat <<EOF
Usage: $(basename "$0") <major|minor|patch> [--plugin <version>] [--dry-run]

Bump the extension version (major/minor/patch), update CHANGELOG.md,
create a git commit and tag.

Options:
  --plugin <version>   Also update $PLUGIN_PKG dependency to <version>
  --dry-run            Show what would happen without making changes
  -h, --help           Show this help

Examples:
  $(basename "$0") patch
  $(basename "$0") minor --plugin 0.0.7
  $(basename "$0") major --plugin 1.0.0 --dry-run
EOF
  exit 0
}

# ─── Parse arguments ─────────────────────────────────────────
BUMP_TYPE=""
PLUGIN_VERSION=""
DRY_RUN=false

while [[ $# -gt 0 ]]; do
  case "$1" in
    major|minor|patch) BUMP_TYPE="$1"; shift ;;
    --plugin) PLUGIN_VERSION="$2"; shift 2 ;;
    --dry-run) DRY_RUN=true; shift ;;
    -h|--help) usage ;;
    *) err "Unknown argument: $1"; usage ;;
  esac
done

if [[ -z "$BUMP_TYPE" ]]; then
  err "Bump type is required (major, minor, or patch)"
  usage
fi

# ─── Pre-flight checks ──────────────────────────────────────
cd "$PROJECT_ROOT"

if [[ -n "$(git status --porcelain)" ]]; then
  err "Working tree is not clean. Commit or stash changes first."
  exit 1
fi

CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
if [[ "$CURRENT_BRANCH" == "HEAD" ]]; then
  err "Detached HEAD state. Checkout a branch first."
  exit 1
fi

# ─── Read current version ───────────────────────────────────
CURRENT_VERSION=$(node -p "require('./package.json').version")
IFS='.' read -r V_MAJOR V_MINOR V_PATCH <<< "$CURRENT_VERSION"

case "$BUMP_TYPE" in
  major) NEW_VERSION="$((V_MAJOR + 1)).0.0" ;;
  minor) NEW_VERSION="${V_MAJOR}.$((V_MINOR + 1)).0" ;;
  patch) NEW_VERSION="${V_MAJOR}.${V_MINOR}.$((V_PATCH + 1))" ;;
esac

TODAY=$(date +%Y-%m-%d)

# ─── Summary ─────────────────────────────────────────────────
echo ""
info "Version bump plan:"
echo "  Extension: $CURRENT_VERSION → $NEW_VERSION ($BUMP_TYPE)"
if [[ -n "$PLUGIN_VERSION" ]]; then
  CURRENT_PLUGIN=$(node -p "require('./package.json').dependencies['$PLUGIN_PKG']")
  echo "  Plugin:    $CURRENT_PLUGIN → $PLUGIN_VERSION"
fi
echo "  Tag:       v$NEW_VERSION"
echo "  Branch:    $CURRENT_BRANCH"
echo ""

if $DRY_RUN; then
  warn "Dry run — no changes made."
  exit 0
fi

# ─── 1. Bump package.json version ───────────────────────────
info "Bumping package.json version to $NEW_VERSION..."
npm version "$NEW_VERSION" --no-git-tag-version --allow-same-version > /dev/null
ok "package.json version updated"

# ─── 2. Update plugin dependency (optional) ─────────────────
if [[ -n "$PLUGIN_VERSION" ]]; then
  info "Updating $PLUGIN_PKG to $PLUGIN_VERSION..."
  node -e "
    const fs = require('fs');
    const pkg = JSON.parse(fs.readFileSync('$PACKAGE_JSON', 'utf8'));
    pkg.dependencies['$PLUGIN_PKG'] = '$PLUGIN_VERSION';
    fs.writeFileSync('$PACKAGE_JSON', JSON.stringify(pkg, null, 2) + '\n');
  "
  ok "$PLUGIN_PKG updated to $PLUGIN_VERSION"
fi

# ─── 3. Update CHANGELOG.md ─────────────────────────────────
info "Updating CHANGELOG.md..."
node -e "
  const fs = require('fs');
  const content = fs.readFileSync('$CHANGELOG', 'utf8');
  const lines = content.split('\n');
  const headerIdx = lines.findIndex(l => l.startsWith('# '));
  if (headerIdx === -1) {
    console.error('Could not find # Changelog header');
    process.exit(1);
  }
  const before = lines.slice(0, headerIdx + 1);
  const after = lines.slice(headerIdx + 1);
  const entry = [
    '',
    '## [$NEW_VERSION] - $TODAY',
    '',
    '### Added',
    '',
    '### Changed',
    '',
    '### Fixed',
    '',
  ];
  const result = [...before, ...entry, ...after].join('\n');
  fs.writeFileSync('$CHANGELOG', result);
"
ok "CHANGELOG.md updated with [$NEW_VERSION] placeholder"

# ─── 4. Reinstall if plugin version changed ─────────────────
if [[ -n "$PLUGIN_VERSION" ]]; then
  info "Running pnpm install to update lockfile..."
  pnpm install --no-frozen-lockfile
  ok "Lockfile updated"
fi

# ─── 5. Git commit & tag ────────────────────────────────────
info "Creating git commit and tag..."
git add package.json CHANGELOG.md
if [[ -n "$PLUGIN_VERSION" ]]; then
  git add pnpm-lock.yaml
fi

COMMIT_MSG="Release v$NEW_VERSION"
if [[ -n "$PLUGIN_VERSION" ]]; then
  COMMIT_MSG="Release v$NEW_VERSION (plugin $PLUGIN_VERSION)"
fi

git commit -m "$COMMIT_MSG"
git tag "v$NEW_VERSION"

ok "Committed and tagged v$NEW_VERSION"

# ─── Done ────────────────────────────────────────────────────
echo ""
ok "Release v$NEW_VERSION complete!"
echo ""
info "Next steps:"
echo "  1. Edit CHANGELOG.md to fill in the release notes"
echo "  2. Run 'pnpm vsce:package' to build the .vsix"
echo "  3. Run 'pnpm vsce:publish' to publish"
echo "  4. Run 'git push && git push --tags' to push"
echo ""

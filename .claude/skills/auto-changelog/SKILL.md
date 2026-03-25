---
name: auto-changelog
description: Automatically generate changelog entries by analyzing git diffs between tags
triggers:
  - changelog
  - release-note
  - release notes
argument-hint: "[tag-range] [--all]"
llm-invocable: false
user-invocable: true
---

# Auto Changelog

Generate structured changelog entries by analyzing git history between tags.

## When to Activate

- User asks to generate a changelog or release notes
- User mentions updating CHANGELOG.md
- Before or after a version bump / release

## Workflow

### 1. Detect Tag Range

Determine the tag range to analyze:

```bash
# List all tags sorted by version
git tag -l --sort=-version:refname

# Get the latest tag
LATEST=$(git tag -l --sort=-version:refname | head -1)

# Get the previous tag
PREVIOUS=$(git tag -l --sort=-version:refname | head -2 | tail -1)
```

If `--all` flag is provided, iterate all consecutive tag pairs.
If a specific range is provided (e.g., `v0.1.3..v0.1.4`), use that directly.

### 2. Gather Commit Data

For each tag range, collect:

```bash
# Commits between tags (excluding release/merge commits)
git log ${PREVIOUS}..${LATEST} --format="%H %s" --reverse --no-merges

# Detailed diff stats
git diff ${PREVIOUS}..${LATEST} --stat

# Full diff for source files (exclude lock files, generated files)
git diff ${PREVIOUS}..${LATEST} -- '*.ts' '*.js' '*.json' '*.md' \
  ':!pnpm-lock.yaml' ':!yarn.lock' ':!package-lock.json'
```

### 3. Analyze and Categorize

Read each commit's full diff (`git show <sha> --stat` and `git show <sha> -- '*.ts' '*.js'`) and categorize changes:

**Added** — New files, new exports, new features, new commands, new UI elements
- Look for: new files in diff, new `export` statements, new function/class definitions
- Keywords in commit messages: "add", "introduce", "implement", "create", "new"

**Changed** — Modified behavior, refactored code, updated dependencies, config changes
- Look for: modified files with behavioral changes, dependency version bumps
- Keywords: "update", "refactor", "enhance", "improve", "change", "rename", "move"

**Fixed** — Bug fixes, error handling improvements, edge case corrections
- Look for: condition changes, error handling additions, null checks
- Keywords: "fix", "resolve", "correct", "handle", "prevent", "escape"

**Removed** — Deleted features, removed files, deprecated code
- Look for: deleted files, removed exports
- Keywords: "remove", "delete", "drop", "deprecate"

### 4. Write Changelog Entry

Format each version entry as:

```markdown
## [<version>] - <date>

### Added

- <description of new feature or capability>

### Changed

- <description of modification>

### Fixed

- <description of bug fix>
```

Rules:
- Each bullet should be a **user-facing description**, not a commit message copy
- Start with a bold keyword or feature name when relevant (e.g., "**Hover tooltip**: ...")
- Include file/function references only when they help understanding
- Omit empty sections (don't write `### Removed` if nothing was removed)
- Use the date from the tag, not the commit (`git log -1 --format=%ai <tag>`)
- Omit "Release vX.Y.Z" commits — they are mechanical, not content

### 5. Update CHANGELOG.md

- Read existing CHANGELOG.md
- Insert new entries at the top (after the `# Changelog` header)
- Preserve all existing entries below
- If entries already exist for a version, **replace** them (don't duplicate)

## Examples

```
User: changelog 작성해줘
→ Detects latest two tags, analyzes diff, writes entry for latest version

User: /auto-changelog --all
→ Iterates all tag pairs, generates entries for every version

User: /auto-changelog v0.1.2..v0.1.3
→ Generates entry for the specific range only
```

## Notes

- Always verify tag existence before proceeding
- For the first version (no previous tag), use the root commit as the base
- Filter out noise: formatting-only changes (Prettier), lockfile updates, CI config
- Group related changes into single bullets rather than one-per-file
- If a commit message is unclear, read the actual diff to understand the change

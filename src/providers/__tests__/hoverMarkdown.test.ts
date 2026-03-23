import { describe, it, expect, vi, beforeEach } from 'vitest';
import { formatHoverMarkdown } from '../hoverMarkdown.js';
import type { DisplayResult } from '../../types/index.js';

vi.mock('vscode', () => {
  const MarkdownString = vi.fn(function (this: Record<string, unknown>) {
    this.value = '';
    this.isTrusted = false;
    this.supportThemeIcons = false;
    this.appendMarkdown = vi.fn(function (
      this: Record<string, unknown>,
      val: string,
    ) {
      this.value = (this.value as string) + val;
    });
  });
  return { MarkdownString };
});

describe('formatHoverMarkdown', () => {
  const display: DisplayResult = {
    found: true,
    prNumber: 42,
    prTitle: 'Fix auth bug',
    prUrl: 'https://github.com/org/repo/pull/42',
    operatingLevel: 2 as const,
    warnings: [],
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns MarkdownString with isTrusted and supportThemeIcons', () => {
    const md = formatHoverMarkdown(display, '/src/auth.ts', 10);

    expect(md.isTrusted).toBe(true);
    expect(md.supportThemeIcons).toBe(true);
  });

  it('includes PR title as clickable link', () => {
    const md = formatHoverMarkdown(display, '/src/auth.ts', 10);
    const value = (md as unknown as { value: string }).value;

    expect(value).toContain('PR #42');
    expect(value).toContain(
      '[Fix auth bug](https://github.com/org/repo/pull/42)',
    );
  });

  it('includes Copy Link command URI with encoded prUrl', () => {
    const md = formatHoverMarkdown(display, '/src/auth.ts', 10);
    const value = (md as unknown as { value: string }).value;

    const expectedArgs = encodeURIComponent(
      JSON.stringify(['https://github.com/org/repo/pull/42']),
    );
    expect(value).toContain(`command:lineLore.copyPrLink?${expectedArgs}`);
  });

  it('includes Show Details command URI with encoded filePath and line', () => {
    const md = formatHoverMarkdown(display, '/src/auth.ts', 10);
    const value = (md as unknown as { value: string }).value;

    const expectedArgs = encodeURIComponent(
      JSON.stringify(['/src/auth.ts', 10]),
    );
    expect(value).toContain(`command:lineLore.showDetails?${expectedArgs}`);
  });

  it('includes Re-trace link with traceFromHover and encoded args', () => {
    const md = formatHoverMarkdown(display, '/src/auth.ts', 10);
    const value = (md as unknown as { value: string }).value;

    const expectedArgs = encodeURIComponent(
      JSON.stringify(['/src/auth.ts', 10]),
    );
    expect(value).toContain(`command:lineLore.traceFromHover?${expectedArgs}`);
  });

  it('includes Origin trace button with traceOriginFromHover command', () => {
    const md = formatHoverMarkdown(display, '/src/auth.ts', 10);
    const value = (md as unknown as { value: string }).value;

    const expectedArgs = encodeURIComponent(
      JSON.stringify(['/src/auth.ts', 10]),
    );
    expect(value).toContain('$(git-merge)');
    expect(value).toContain(
      `command:lineLore.traceOriginFromHover?${expectedArgs}`,
    );
  });

  describe('Scenario B: origin-only cached', () => {
    it('shows $(git-merge) icon and (Origin) label', () => {
      const notFound: DisplayResult = {
        found: false,
        operatingLevel: 0 as const,
        warnings: [],
      };
      const originOnly: DisplayResult = {
        found: true,
        prNumber: 99,
        prTitle: 'Refactor auth flow',
        prUrl: 'https://github.com/org/repo/pull/99',
        operatingLevel: 2 as const,
        warnings: [],
      };
      const md = formatHoverMarkdown(notFound, '/src/auth.ts', 10, originOnly);
      const value = (md as unknown as { value: string }).value;

      expect(value).toContain('$(git-merge)');
      expect(value).toContain('(Origin)');
      expect(value).toContain('PR #99');
      expect(value).toContain(
        '[Refactor auth flow](https://github.com/org/repo/pull/99)',
      );
      // Copy Link should use origin-mode prUrl
      const copyArgs = encodeURIComponent(
        JSON.stringify(['https://github.com/org/repo/pull/99']),
      );
      expect(value).toContain(`command:lineLore.copyPrLink?${copyArgs}`);
    });
  });

  describe('Scenario C: both cached, different PRs', () => {
    it('shows Origin and Modifier labeled sections', () => {
      const strictDiff: DisplayResult = {
        found: true,
        prNumber: 99,
        prTitle: 'Refactor auth flow',
        prUrl: 'https://github.com/org/repo/pull/99',
        operatingLevel: 2 as const,
        warnings: [],
      };
      const md = formatHoverMarkdown(display, '/src/auth.ts', 10, strictDiff);
      const value = (md as unknown as { value: string }).value;

      expect(value).toContain('(Origin)');
      expect(value).toContain('(Modifier)');
      expect(value).toContain('PR #42');
      expect(value).toContain('PR #99');
    });
  });

  describe('Scenario D: both cached, same PR', () => {
    it('shows $(check) match indicator', () => {
      const strictSame: DisplayResult = {
        found: true,
        prNumber: 42,
        prTitle: 'Fix auth bug',
        prUrl: 'https://github.com/org/repo/pull/42',
        operatingLevel: 2 as const,
        warnings: [],
      };
      const md = formatHoverMarkdown(display, '/src/auth.ts', 10, strictSame);
      const value = (md as unknown as { value: string }).value;

      expect(value).toContain('$(check)');
      expect(value).toContain('Origin and modifier match');
      expect(value).not.toContain('(Origin)');
      expect(value).not.toContain('(Modifier)');
    });
  });
});

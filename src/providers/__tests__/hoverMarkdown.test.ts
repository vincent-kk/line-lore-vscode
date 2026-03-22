import { describe, it, expect, vi, beforeEach } from 'vitest';
import { formatHoverMarkdown } from '../hoverMarkdown.js';
import type { DisplayResult } from '../../types/index.js';

vi.mock('vscode', () => {
  const MarkdownString = vi.fn(function (this: Record<string, unknown>) {
    this.value = '';
    this.isTrusted = false;
    this.supportThemeIcons = false;
    this.appendMarkdown = vi.fn(function (this: Record<string, unknown>, val: string) {
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
    expect(value).toContain('[Fix auth bug](https://github.com/org/repo/pull/42)');
  });

  it('includes Copy Link command URI with encoded prUrl', () => {
    const md = formatHoverMarkdown(display, '/src/auth.ts', 10);
    const value = (md as unknown as { value: string }).value;

    const expectedArgs = encodeURIComponent(JSON.stringify(['https://github.com/org/repo/pull/42']));
    expect(value).toContain(`command:lineLore.copyPrLink?${expectedArgs}`);
  });

  it('includes Show Details command URI with encoded filePath and line', () => {
    const md = formatHoverMarkdown(display, '/src/auth.ts', 10);
    const value = (md as unknown as { value: string }).value;

    const expectedArgs = encodeURIComponent(JSON.stringify(['/src/auth.ts', 10]));
    expect(value).toContain(`command:lineLore.showDetails?${expectedArgs}`);
  });

  it('includes Re-trace link', () => {
    const md = formatHoverMarkdown(display, '/src/auth.ts', 10);
    const value = (md as unknown as { value: string }).value;

    expect(value).toContain('command:lineLore.tracePR');
  });
});

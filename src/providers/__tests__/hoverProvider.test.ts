import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LineLoreHoverProvider } from '../hoverProvider.js';

vi.mock('vscode', () => {
  const MarkdownString = vi.fn(function (this: Record<string, unknown>, value: string) {
    this.value = value;
    this.isTrusted = false;
    this.supportThemeIcons = false;
  });
  const Hover = vi.fn(function (this: Record<string, unknown>, contents: unknown) {
    this.contents = contents;
  });
  return {
    workspace: {
      getConfiguration: vi.fn(() => ({
        get: vi.fn((_key: string, defaultValue: unknown) => defaultValue),
      })),
    },
    MarkdownString,
    Hover,
  };
});

import * as vscode from 'vscode';

describe('LineLoreHoverProvider', () => {
  let provider: LineLoreHoverProvider;

  beforeEach(() => {
    vi.clearAllMocks();
    provider = new LineLoreHoverProvider();
  });

  it('returns Hover with command link MarkdownString', () => {
    const result = provider.provideHover(
      {} as never,
      {} as never,
      {} as never,
    );

    expect(result).toBeDefined();
    expect(vscode.MarkdownString).toHaveBeenCalledWith(
      '$(search) [Line Lore: Trace PR](command:lineLore.tracePR)',
    );
  });

  it('sets isTrusted and supportThemeIcons on MarkdownString', () => {
    const result = provider.provideHover(
      {} as never,
      {} as never,
      {} as never,
    ) as unknown as { contents: { isTrusted: boolean; supportThemeIcons: boolean } };

    expect(result).toBeDefined();
    expect(result.contents.isTrusted).toBe(true);
    expect(result.contents.supportThemeIcons).toBe(true);
  });

  it('returns undefined when hover provider is disabled', () => {
    const mockGet = vi.fn((key: string) => {
      if (key === 'hoverProvider.enabled') { return false; }
      return true;
    });
    vi.mocked(vscode.workspace.getConfiguration).mockReturnValue({ get: mockGet } as never);

    const result = provider.provideHover(
      {} as never,
      {} as never,
      {} as never,
    );

    expect(result).toBeUndefined();
  });
});

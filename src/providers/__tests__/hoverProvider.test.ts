import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LineLoreHoverProvider } from '../hoverProvider.js';

vi.mock('vscode', () => {
  const MarkdownString = vi.fn(function (this: Record<string, unknown>, value?: string) {
    this.value = value ?? '';
    this.isTrusted = false;
    this.supportThemeIcons = false;
    this.appendMarkdown = vi.fn(function (this: Record<string, unknown>, val: string) {
      this.value = (this.value as string) + val;
    });
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

vi.mock('../../core/index.js', () => ({
  formatTraceResult: vi.fn(),
}));

vi.mock('../hoverMarkdown.js', () => ({
  formatHoverMarkdown: vi.fn(() => {
    const md = { value: 'rich-hover', isTrusted: true, supportThemeIcons: true };
    return md;
  }),
}));

import * as vscode from 'vscode';
import { formatTraceResult } from '../../core/index.js';

const mockTraceCached = vi.fn();
const mockAdapter = { traceCached: mockTraceCached } as never;

describe('LineLoreHoverProvider', () => {
  let provider: LineLoreHoverProvider;

  const mockDocument = {
    uri: { fsPath: '/workspace/src/auth.ts' },
  } as never;

  const mockPosition = { line: 41 } as never;

  const mockToken = {
    onCancellationRequested: vi.fn(() => ({ dispose: vi.fn() })),
  } as never;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(vscode.workspace.getConfiguration).mockImplementation(
      () => ({ get: vi.fn((_key: string, defaultValue: unknown) => defaultValue) }) as never,
    );
    provider = new LineLoreHoverProvider(mockAdapter);
  });

  // Note: detailPanel removed from HoverProvider constructor — only adapter needed

  it('returns static fallback when cache misses (empty nodes)', async () => {
    const emptyResult = {
      nodes: [],
      operatingLevel: 0,
      featureFlags: { astDiff: false, deepTrace: false, commitGraph: false, graphql: false },
      warnings: [],
    };
    mockTraceCached.mockResolvedValue(emptyResult);
    vi.mocked(formatTraceResult).mockReturnValue({
      found: false,
      operatingLevel: 0 as const,
      warnings: [],
    });

    const result = await provider.provideHover(mockDocument, mockPosition, mockToken);

    expect(result).toBeDefined();
    expect(vscode.MarkdownString).toHaveBeenCalledWith(
      '$(search) [Line Lore: Trace PR](command:lineLore.tracePR)',
    );
  });

  it('returns rich hover when cache hits with PR', async () => {
    const mockResult = {
      nodes: [{ type: 'pull_request', prNumber: 123, prTitle: 'Fix bug', prUrl: 'https://github.com/pr/123' }],
      operatingLevel: 2,
      warnings: [],
    };
    mockTraceCached.mockResolvedValue(mockResult);
    vi.mocked(formatTraceResult).mockReturnValue({
      found: true,
      prNumber: 123,
      prTitle: 'Fix bug',
      prUrl: 'https://github.com/pr/123',
      operatingLevel: 2 as const,
      warnings: [],
    });

    const result = await provider.provideHover(mockDocument, mockPosition, mockToken);

    expect(result).toBeDefined();
    expect(mockTraceCached).toHaveBeenCalledWith('/workspace/src/auth.ts', 42);
  });

  it('returns static fallback when traceCached throws', async () => {
    mockTraceCached.mockRejectedValue(new Error('cache error'));

    const result = await provider.provideHover(mockDocument, mockPosition, mockToken);

    expect(result).toBeDefined();
    expect(vscode.MarkdownString).toHaveBeenCalledWith(
      '$(search) [Line Lore: Trace PR](command:lineLore.tracePR)',
    );
  });

  it('returns undefined when hover provider is disabled', async () => {
    const mockGet = vi.fn((key: string) => {
      if (key === 'hoverProvider.enabled') { return false; }
      return true;
    });
    vi.mocked(vscode.workspace.getConfiguration).mockReturnValue({ get: mockGet } as never);

    const result = await provider.provideHover(mockDocument, mockPosition, mockToken);

    expect(result).toBeUndefined();
  });

  it('sets isTrusted and supportThemeIcons on static fallback', async () => {
    mockTraceCached.mockResolvedValue({
      nodes: [],
      operatingLevel: 0,
      featureFlags: { astDiff: false, deepTrace: false, commitGraph: false, graphql: false },
      warnings: [],
    });
    vi.mocked(formatTraceResult).mockReturnValue({
      found: false,
      operatingLevel: 0 as const,
      warnings: [],
    });

    const result = await provider.provideHover(mockDocument, mockPosition, mockToken) as unknown as {
      contents: { isTrusted: boolean; supportThemeIcons: boolean };
    };

    expect(result).toBeDefined();
    expect(result.contents.isTrusted).toBe(true);
    expect(result.contents.supportThemeIcons).toBe(true);
  });
});

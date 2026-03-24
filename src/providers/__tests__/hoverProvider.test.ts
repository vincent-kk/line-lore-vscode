import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LineLoreHoverProvider } from '../hoverProvider.js';

vi.mock('vscode', () => {
  const MarkdownString = vi.fn(function (
    this: Record<string, unknown>,
    value?: string,
  ) {
    this.value = value ?? '';
    this.isTrusted = false;
    this.supportThemeIcons = false;
    this.appendMarkdown = vi.fn(function (
      this: Record<string, unknown>,
      val: string,
    ) {
      this.value = (this.value as string) + val;
    });
  });
  const Hover = vi.fn(function (
    this: Record<string, unknown>,
    contents: unknown,
  ) {
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
    const md = {
      value: 'rich-hover',
      isTrusted: true,
      supportThemeIcons: true,
    };
    return md;
  }),
}));

import * as vscode from 'vscode';
import { formatTraceResult } from '../../core/index.js';
import { formatHoverMarkdown } from '../hoverMarkdown.js';

const mockTraceCached = vi.fn();
const mockAdapter = { traceCached: mockTraceCached } as never;

describe('LineLoreHoverProvider', () => {
  let provider: LineLoreHoverProvider;

  const mockDocument = {
    uri: { fsPath: '/workspace/src/auth.ts' },
    lineAt: vi.fn(() => ({ text: 'const foo = bar;' })),
  } as never;

  const mockToken = {
    onCancellationRequested: vi.fn(() => ({ dispose: vi.fn() })),
  } as never;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(vscode.workspace.getConfiguration).mockImplementation(
      () =>
        ({
          get: vi.fn((_key: string, defaultValue: unknown) => defaultValue),
        }) as never,
    );
    provider = new LineLoreHoverProvider(mockAdapter);
  });

  it('returns undefined when hovering on code text (position within text)', async () => {
    const positionOnCode = { line: 41, character: 5 } as never;

    const result = await provider.provideHover(
      mockDocument,
      positionOnCode,
      mockToken,
    );

    expect(result).toBeUndefined();
    expect(mockTraceCached).not.toHaveBeenCalled();
  });

  it('calls traceCached twice (normal + origin) via Promise.allSettled', async () => {
    const positionAtEnd = { line: 41, character: 16 } as never;
    mockTraceCached.mockResolvedValue({
      nodes: [],
      operatingLevel: 0,
      featureFlags: {
        astDiff: false,
        deepTrace: false,
        commitGraph: false,
        graphql: false,
      },
      warnings: [],
    });
    vi.mocked(formatTraceResult).mockReturnValue({
      found: false,
      operatingLevel: 0 as const,
      warnings: [],
    });

    await provider.provideHover(mockDocument, positionAtEnd, mockToken);

    expect(mockTraceCached).toHaveBeenCalledTimes(2);
    expect(mockTraceCached).toHaveBeenCalledWith(
      '/workspace/src/auth.ts',
      42,
    );
    expect(mockTraceCached).toHaveBeenCalledWith(
      '/workspace/src/auth.ts',
      42,
      'origin',
    );
  });

  it('returns rich hover when normal cache hits with PR', async () => {
    const positionAtEnd = { line: 41, character: 16 } as never;
    mockTraceCached.mockImplementation(
      (_filePath: string, _line: number, mode?: string) => {
        if (mode === 'origin') {
          return Promise.resolve({
            nodes: [],
            operatingLevel: 0,
            warnings: [],
          });
        }
        return Promise.resolve({
          nodes: [
            {
              type: 'pull_request',
              prNumber: 123,
              prTitle: 'Fix bug',
              prUrl: 'https://github.com/pr/123',
            },
          ],
          operatingLevel: 2,
          warnings: [],
        });
      },
    );
    vi.mocked(formatTraceResult).mockImplementation((result) => {
      const prNode = result.nodes.find(
        (n: { type: string }) => n.type === 'pull_request',
      ) as { prNumber?: number; prTitle?: string; prUrl?: string } | undefined;
      if (prNode) {
        return {
          found: true,
          prNumber: prNode.prNumber,
          prTitle: prNode.prTitle,
          prUrl: prNode.prUrl,
          operatingLevel: result.operatingLevel,
          warnings: [],
        };
      }
      return {
        found: false,
        operatingLevel: result.operatingLevel,
        warnings: [],
      };
    });

    const result = await provider.provideHover(
      mockDocument,
      positionAtEnd,
      mockToken,
    );

    expect(result).toBeDefined();
    expect(formatHoverMarkdown).toHaveBeenCalled();
  });

  it('returns rich hover when only origin-mode cache hits', async () => {
    const positionAtEnd = { line: 41, character: 16 } as never;
    mockTraceCached.mockImplementation(
      (_filePath: string, _line: number, mode?: string) => {
        if (mode === 'origin') {
          return Promise.resolve({
            nodes: [
              {
                type: 'pull_request',
                prNumber: 99,
                prTitle: 'Refactor auth',
                prUrl: 'https://github.com/pr/99',
              },
            ],
            operatingLevel: 2,
            warnings: [],
          });
        }
        return Promise.resolve({
          nodes: [],
          operatingLevel: 0,
          warnings: [],
        });
      },
    );
    vi.mocked(formatTraceResult).mockImplementation((result) => {
      const prNode = result.nodes.find(
        (n: { type: string }) => n.type === 'pull_request',
      ) as { prNumber?: number; prTitle?: string; prUrl?: string } | undefined;
      if (prNode) {
        return {
          found: true,
          prNumber: prNode.prNumber,
          prTitle: prNode.prTitle,
          prUrl: prNode.prUrl,
          operatingLevel: result.operatingLevel,
          warnings: [],
        };
      }
      return {
        found: false,
        operatingLevel: result.operatingLevel,
        warnings: [],
      };
    });

    const result = await provider.provideHover(
      mockDocument,
      positionAtEnd,
      mockToken,
    );

    expect(result).toBeDefined();
    expect(formatHoverMarkdown).toHaveBeenCalled();
    const [display, , , originDisplay] = vi.mocked(formatHoverMarkdown).mock
      .calls[0];
    expect((display as { found: boolean }).found).toBe(false);
    expect((originDisplay as { found: boolean }).found).toBe(true);
  });

  it('returns undefined when line is uncommitted (zero-hash commitSha)', async () => {
    const positionAtEnd = { line: 41, character: 20 } as never;
    mockTraceCached.mockResolvedValue({
      nodes: [{ type: 'original_commit', sha: '0'.repeat(40) }],
      operatingLevel: 0,
      featureFlags: {
        astDiff: false,
        deepTrace: false,
        commitGraph: false,
        graphql: false,
      },
      warnings: [],
    });
    vi.mocked(formatTraceResult).mockReturnValue({
      found: false,
      commitSha: '0'.repeat(40),
      operatingLevel: 0 as const,
      warnings: [],
    });

    const result = await provider.provideHover(
      mockDocument,
      positionAtEnd,
      mockToken,
    );

    expect(result).toBeUndefined();
  });

  it('returns static fallback when committed line has no cached PR', async () => {
    const positionAtEnd = { line: 41, character: 20 } as never;
    mockTraceCached.mockResolvedValue({
      nodes: [{ type: 'original_commit', sha: 'abc123' }],
      operatingLevel: 0,
      featureFlags: {
        astDiff: false,
        deepTrace: false,
        commitGraph: false,
        graphql: false,
      },
      warnings: [],
    });
    vi.mocked(formatTraceResult).mockReturnValue({
      found: false,
      commitSha: 'abc123',
      operatingLevel: 0 as const,
      warnings: [],
    });

    const result = await provider.provideHover(
      mockDocument,
      positionAtEnd,
      mockToken,
    );

    expect(result).toBeDefined();
    expect(vscode.MarkdownString).toHaveBeenCalledWith(
      `$(search) [Line Lore: Trace PR](command:lineLore.traceFromHover?${encodeURIComponent(JSON.stringify(['/workspace/src/auth.ts', 42]))})`,
    );
  });

  it('returns undefined when hover provider is disabled', async () => {
    const mockGet = vi.fn((key: string) => {
      if (key === 'hoverProvider.enabled') {
        return false;
      }
      return true;
    });
    vi.mocked(vscode.workspace.getConfiguration).mockReturnValue({
      get: mockGet,
    } as never);

    const positionAtEnd = { line: 41, character: 20 } as never;
    const result = await provider.provideHover(
      mockDocument,
      positionAtEnd,
      mockToken,
    );

    expect(result).toBeUndefined();
  });
});

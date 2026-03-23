import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  executeTraceFromHover,
  executeTraceOriginFromHover,
} from '../traceFromHover.js';
import { LineLoreError } from '@lumy-pack/line-lore';

vi.mock('vscode', () => ({
  window: {
    showInformationMessage: vi.fn(),
    showWarningMessage: vi.fn(),
    showErrorMessage: vi.fn(),
  },
  env: {
    openExternal: vi.fn(),
    clipboard: { writeText: vi.fn() },
  },
  Uri: { parse: (s: string) => s },
}));

vi.mock('../../core/index.js', () => ({
  formatTraceResult: vi.fn(
    (result: {
      nodes: Array<{
        type: string;
        prNumber?: number;
        prTitle?: string;
        prUrl?: string;
        sha?: string;
      }>;
      operatingLevel: number;
    }) => {
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
      const commitNode = result.nodes.find(
        (n: { type: string }) => n.type === 'original_commit',
      ) as { sha?: string } | undefined;
      return {
        found: false,
        commitSha: commitNode?.sha,
        operatingLevel: result.operatingLevel,
        warnings: [],
      };
    },
  ),
  formatErrorMessage: vi.fn((code: string) => ({
    message: `Error: ${code}`,
    severity: 'error',
  })),
}));

import * as vscode from 'vscode';

describe('executeTraceFromHover', () => {
  const mockAdapter = {
    trace: vi.fn(),
  };

  const mockStatusBar = {
    showLoading: vi.fn(),
    showResult: vi.fn(),
    showError: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls statusBar.showLoading on invocation', async () => {
    mockAdapter.trace.mockResolvedValue({
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

    const handler = executeTraceFromHover(
      mockAdapter as never,
      mockStatusBar as never,
    );
    await handler('/workspace/src/auth.ts', 42);

    expect(mockStatusBar.showLoading).toHaveBeenCalled();
  });

  it('calls adapter.trace with provided filePath and line', async () => {
    mockAdapter.trace.mockResolvedValue({
      nodes: [
        {
          type: 'pull_request',
          trackingMethod: 'api',
          confidence: 'exact',
          prNumber: 42,
          prTitle: 'feat: auth',
          prUrl: 'https://github.com/org/repo/pull/42',
        },
      ],
      operatingLevel: 2,
      featureFlags: {
        astDiff: true,
        deepTrace: false,
        commitGraph: true,
        graphql: true,
      },
      warnings: [],
    });

    const handler = executeTraceFromHover(
      mockAdapter as never,
      mockStatusBar as never,
    );
    await handler('/workspace/src/auth.ts', 42);

    expect(mockAdapter.trace).toHaveBeenCalledWith(
      '/workspace/src/auth.ts',
      42,
      undefined,
      undefined,
    );
  });

  it('populates cache and shows status on successful trace with PR', async () => {
    mockAdapter.trace.mockResolvedValue({
      nodes: [
        {
          type: 'pull_request',
          trackingMethod: 'api',
          confidence: 'exact',
          prNumber: 42,
          prTitle: 'feat: auth',
          prUrl: 'https://github.com/org/repo/pull/42',
        },
      ],
      operatingLevel: 2,
      featureFlags: {
        astDiff: false,
        deepTrace: false,
        commitGraph: false,
        graphql: false,
      },
      warnings: [],
    });

    const handler = executeTraceFromHover(
      mockAdapter as never,
      mockStatusBar as never,
    );
    await handler('/workspace/src/auth.ts', 10);

    expect(mockStatusBar.showResult).toHaveBeenCalledWith(2);
    expect(vscode.window.showWarningMessage).not.toHaveBeenCalled();
  });

  it('shows warning when no PR found', async () => {
    mockAdapter.trace.mockResolvedValue({
      nodes: [
        {
          type: 'original_commit',
          sha: 'def456',
          trackingMethod: 'blame',
          confidence: 'exact',
        },
      ],
      operatingLevel: 0,
      featureFlags: {
        astDiff: false,
        deepTrace: false,
        commitGraph: false,
        graphql: false,
      },
      warnings: [],
    });

    const handler = executeTraceFromHover(
      mockAdapter as never,
      mockStatusBar as never,
    );
    await handler('/workspace/src/auth.ts', 42);

    expect(vscode.window.showWarningMessage).toHaveBeenCalledWith(
      'No PR found for this line. Commit: def456',
    );
  });

  it('calls handleTraceError when adapter.trace throws', async () => {
    mockAdapter.trace.mockRejectedValue(
      new LineLoreError('FILE_NOT_FOUND', 'File not found', {}),
    );

    const handler = executeTraceFromHover(
      mockAdapter as never,
      mockStatusBar as never,
    );
    await handler('/workspace/src/auth.ts', 42);

    expect(mockStatusBar.showError).toHaveBeenCalled();
  });
});

describe('executeTraceOriginFromHover', () => {
  const mockAdapter = {
    trace: vi.fn(),
  };

  const mockStatusBar = {
    showLoading: vi.fn(),
    showResult: vi.fn(),
    showError: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls adapter.trace with { mode: "change" } override', async () => {
    mockAdapter.trace.mockResolvedValue({
      nodes: [
        {
          type: 'pull_request',
          trackingMethod: 'api',
          confidence: 'exact',
          prNumber: 99,
          prTitle: 'refactor: auth flow',
          prUrl: 'https://github.com/org/repo/pull/99',
        },
      ],
      operatingLevel: 2,
      featureFlags: {
        astDiff: false,
        deepTrace: false,
        commitGraph: false,
        graphql: false,
      },
      warnings: [],
    });

    const handler = executeTraceOriginFromHover(
      mockAdapter as never,
      mockStatusBar as never,
    );
    await handler('/workspace/src/auth.ts', 42);

    expect(mockAdapter.trace).toHaveBeenCalledWith(
      '/workspace/src/auth.ts',
      42,
      undefined,
      { mode: 'origin' },
    );
  });

  it('shows origin-mode-specific warning when no PR found', async () => {
    mockAdapter.trace.mockResolvedValue({
      nodes: [
        {
          type: 'original_commit',
          sha: 'abc123',
          trackingMethod: 'blame',
          confidence: 'exact',
        },
      ],
      operatingLevel: 0,
      featureFlags: {
        astDiff: false,
        deepTrace: false,
        commitGraph: false,
        graphql: false,
      },
      warnings: [],
    });

    const handler = executeTraceOriginFromHover(
      mockAdapter as never,
      mockStatusBar as never,
    );
    await handler('/workspace/src/auth.ts', 42);

    expect(vscode.window.showWarningMessage).toHaveBeenCalledWith(
      'No PR found (origin mode — follows rename/move history). Commit: abc123',
    );
  });

  it('shows [Origin] prefix in info message when PR found', async () => {
    mockAdapter.trace.mockResolvedValue({
      nodes: [
        {
          type: 'pull_request',
          trackingMethod: 'api',
          confidence: 'exact',
          prNumber: 99,
          prTitle: 'refactor: auth flow',
          prUrl: 'https://github.com/org/repo/pull/99',
        },
      ],
      operatingLevel: 2,
      featureFlags: {
        astDiff: false,
        deepTrace: false,
        commitGraph: false,
        graphql: false,
      },
      warnings: [],
    });

    const handler = executeTraceOriginFromHover(
      mockAdapter as never,
      mockStatusBar as never,
    );
    await handler('/workspace/src/auth.ts', 42);

    expect(vscode.window.showInformationMessage).toHaveBeenCalledWith(
      '[Origin] PR #99: refactor: auth flow',
      'Open PR',
      'Copy Link',
    );
  });
});

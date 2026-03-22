import { describe, it, expect, vi, beforeEach } from 'vitest';
import { executeTraceFromHover } from '../traceFromHover.js';
import { LineLoreError } from '@lumy-pack/line-lore';

const mockExecuteCommand = vi.fn().mockReturnValue(Promise.resolve());

vi.mock('vscode', () => ({
  window: {
    activeTextEditor: {
      document: { uri: { fsPath: '/workspace/src/auth.ts' } },
      selection: { active: { line: 41 } },
    },
    showInformationMessage: vi.fn(),
    showWarningMessage: vi.fn(),
    showErrorMessage: vi.fn(),
  },
  env: {
    openExternal: vi.fn(),
    clipboard: { writeText: vi.fn() },
  },
  Uri: { parse: (s: string) => s },
  commands: {
    executeCommand: (...args: unknown[]) => mockExecuteCommand(...args),
  },
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
      featureFlags: { astDiff: false, deepTrace: false, commitGraph: false, graphql: false },
      warnings: [],
    });

    const handler = executeTraceFromHover(mockAdapter as never, mockStatusBar as never);
    await handler('/workspace/src/auth.ts', 42);

    expect(mockStatusBar.showLoading).toHaveBeenCalled();
  });

  it('calls adapter.trace with provided filePath and line', async () => {
    mockAdapter.trace.mockResolvedValue({
      nodes: [
        { type: 'pull_request', trackingMethod: 'api', confidence: 'exact', prNumber: 42, prTitle: 'feat: auth', prUrl: 'https://github.com/org/repo/pull/42' },
      ],
      operatingLevel: 2,
      featureFlags: { astDiff: true, deepTrace: false, commitGraph: true, graphql: true },
      warnings: [],
    });

    const handler = executeTraceFromHover(mockAdapter as never, mockStatusBar as never);
    await handler('/workspace/src/auth.ts', 42);

    expect(mockAdapter.trace).toHaveBeenCalledWith('/workspace/src/auth.ts', 42);
  });

  it('shows PR info message on successful trace', async () => {
    mockAdapter.trace.mockResolvedValue({
      nodes: [
        { type: 'pull_request', trackingMethod: 'api', confidence: 'exact', prNumber: 42, prTitle: 'feat: auth', prUrl: 'https://github.com/org/repo/pull/42' },
      ],
      operatingLevel: 2,
      featureFlags: { astDiff: false, deepTrace: false, commitGraph: false, graphql: false },
      warnings: [],
    });

    const handler = executeTraceFromHover(mockAdapter as never, mockStatusBar as never);
    await handler('/workspace/src/auth.ts', 10);

    expect(mockStatusBar.showResult).toHaveBeenCalledWith(2);
    expect(vscode.window.showInformationMessage).toHaveBeenCalledWith(
      'PR #42: feat: auth',
      'Open PR', 'Copy Link',
    );
  });

  it('shows warning when no PR found', async () => {
    mockAdapter.trace.mockResolvedValue({
      nodes: [{ type: 'original_commit', sha: 'def456', trackingMethod: 'blame', confidence: 'exact' }],
      operatingLevel: 0,
      featureFlags: { astDiff: false, deepTrace: false, commitGraph: false, graphql: false },
      warnings: [],
    });

    const handler = executeTraceFromHover(mockAdapter as never, mockStatusBar as never);
    await handler('/workspace/src/auth.ts', 42);

    expect(vscode.window.showWarningMessage).toHaveBeenCalledWith(
      'No PR found for this line. Commit: def456',
    );
  });

  it('calls handleTraceError when adapter.trace throws', async () => {
    mockAdapter.trace.mockRejectedValue(
      new LineLoreError('FILE_NOT_FOUND', 'File not found', {}),
    );

    const handler = executeTraceFromHover(mockAdapter as never, mockStatusBar as never);
    await handler('/workspace/src/auth.ts', 42);

    expect(mockStatusBar.showError).toHaveBeenCalled();
  });

  it('fires editor.action.showHover after successful trace', async () => {
    mockAdapter.trace.mockResolvedValue({
      nodes: [
        { type: 'pull_request', trackingMethod: 'api', confidence: 'exact', prNumber: 1, prTitle: 'test', prUrl: 'https://github.com/test' },
      ],
      operatingLevel: 2,
      featureFlags: { astDiff: false, deepTrace: false, commitGraph: false, graphql: false },
      warnings: [],
    });

    const handler = executeTraceFromHover(mockAdapter as never, mockStatusBar as never);
    await handler('/workspace/src/auth.ts', 10);

    expect(mockExecuteCommand).toHaveBeenCalledWith('editor.action.showHover');
  });

  it('handles showHover rejection silently', async () => {
    mockAdapter.trace.mockResolvedValue({
      nodes: [],
      operatingLevel: 0,
      featureFlags: { astDiff: false, deepTrace: false, commitGraph: false, graphql: false },
      warnings: [],
    });
    mockExecuteCommand.mockReturnValue(Promise.reject(new Error('showHover failed')));

    const handler = executeTraceFromHover(mockAdapter as never, mockStatusBar as never);
    await handler('/workspace/src/auth.ts', 10);

    expect(mockStatusBar.showResult).toHaveBeenCalledWith(0);
  });
});

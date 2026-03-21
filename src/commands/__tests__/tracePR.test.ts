import { describe, it, expect, vi, beforeEach } from 'vitest';
import { executeTracePR } from '../tracePR.js';
import { LineLoreError } from '@lumy-pack/line-lore';

vi.mock('vscode', () => {
  const showInformationMessage = vi.fn();
  const showWarningMessage = vi.fn();
  const showErrorMessage = vi.fn();
  return {
    window: {
      activeTextEditor: {
        document: { uri: { fsPath: '/workspace/src/auth.ts' } },
        selection: { active: { line: 41 } },
      },
      showInformationMessage,
      showWarningMessage,
      showErrorMessage,
    },
    env: {
      openExternal: vi.fn(),
      clipboard: { writeText: vi.fn() },
    },
    Uri: { parse: (s: string) => s },
  };
});

import * as vscode from 'vscode';

describe('executeTracePR', () => {
  const mockAdapter = {
    trace: vi.fn(),
    health: vi.fn(),
    clearCache: vi.fn(),
  };

  const mockStatusBar = {
    showLoading: vi.fn(),
    showResult: vi.fn(),
    showError: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows PR info when trace finds a PR', async () => {
    mockAdapter.trace.mockResolvedValue({
      nodes: [
        { type: 'original_commit', sha: 'abc123', trackingMethod: 'blame', confidence: 'exact' },
        { type: 'pull_request', trackingMethod: 'api', confidence: 'exact', prNumber: 42, prTitle: 'feat: auth', prUrl: 'https://github.com/org/repo/pull/42' },
      ],
      operatingLevel: 2,
      featureFlags: { astDiff: true, deepTrace: false, commitGraph: true, graphql: true },
      warnings: [],
    });

    const handler = executeTracePR(mockAdapter as never, mockStatusBar as never);
    await handler();

    expect(mockStatusBar.showLoading).toHaveBeenCalled();
    expect(mockAdapter.trace).toHaveBeenCalledWith('/workspace/src/auth.ts', 42);
    expect(mockStatusBar.showResult).toHaveBeenCalledWith(2);
    expect(vscode.window.showInformationMessage).toHaveBeenCalledWith('PR #42: feat: auth', 'Open PR', 'Copy Link');
  });

  it('shows warning when no PR found', async () => {
    mockAdapter.trace.mockResolvedValue({
      nodes: [{ type: 'original_commit', sha: 'def456', trackingMethod: 'blame', confidence: 'exact' }],
      operatingLevel: 0,
      featureFlags: { astDiff: false, deepTrace: false, commitGraph: false, graphql: false },
      warnings: [],
    });

    const handler = executeTracePR(mockAdapter as never, mockStatusBar as never);
    await handler();

    expect(vscode.window.showWarningMessage).toHaveBeenCalledWith('No PR found for this line. Commit: def456');
  });

  it('shows error message on LineLoreError', async () => {
    mockAdapter.trace.mockRejectedValue(
      new LineLoreError('FILE_NOT_FOUND', 'File not found', {}),
    );

    const handler = executeTracePR(mockAdapter as never, mockStatusBar as never);
    await handler();

    expect(mockStatusBar.showError).toHaveBeenCalled();
    expect(vscode.window.showErrorMessage).toHaveBeenCalledWith('File not found. It may have been moved or deleted.');
  });

  it('handles Open PR button click', async () => {
    mockAdapter.trace.mockResolvedValue({
      nodes: [{ type: 'pull_request', trackingMethod: 'api', confidence: 'exact', prNumber: 1, prTitle: 'test', prUrl: 'https://github.com/test' }],
      operatingLevel: 2,
      featureFlags: { astDiff: false, deepTrace: false, commitGraph: false, graphql: false },
      warnings: [],
    });
    vi.mocked(vscode.window.showInformationMessage).mockResolvedValue('Open PR' as never);

    const handler = executeTracePR(mockAdapter as never, mockStatusBar as never);
    await handler();

    expect(vscode.env.openExternal).toHaveBeenCalledWith('https://github.com/test');
  });

  it('handles Copy Link button click', async () => {
    mockAdapter.trace.mockResolvedValue({
      nodes: [{ type: 'pull_request', trackingMethod: 'api', confidence: 'exact', prNumber: 1, prTitle: 'test', prUrl: 'https://github.com/test' }],
      operatingLevel: 2,
      featureFlags: { astDiff: false, deepTrace: false, commitGraph: false, graphql: false },
      warnings: [],
    });
    vi.mocked(vscode.window.showInformationMessage).mockResolvedValue('Copy Link' as never);

    const handler = executeTracePR(mockAdapter as never, mockStatusBar as never);
    await handler();

    expect(vscode.env.clipboard.writeText).toHaveBeenCalledWith('https://github.com/test');
  });
});

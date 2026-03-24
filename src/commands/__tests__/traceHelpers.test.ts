import { describe, it, expect, vi, beforeEach } from 'vitest';
import { showTraceResult, handleTraceError } from '../traceHelpers.js';
import { LineLoreError } from '@lumy-pack/line-lore';
import type { DisplayResult, TraceFullResult } from '../../types/index.js';

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

import * as vscode from 'vscode';

const mockResult: TraceFullResult = {
  nodes: [
    {
      type: 'pull_request',
      trackingMethod: 'api',
      confidence: 'exact',
      prNumber: 42,
      prUrl: 'https://github.com/test',
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
};

describe('showTraceResult', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows Open PR and Copy Link buttons when no detailPanel', async () => {
    const display: DisplayResult = {
      found: true,
      prNumber: 42,
      prTitle: 'test',
      prUrl: 'https://github.com/test',
      operatingLevel: 2,
      warnings: [],
    };

    await showTraceResult(display, mockResult, '/file.ts', 1, 'No PR.');

    expect(vscode.window.showInformationMessage).toHaveBeenCalledWith(
      'PR #42: test',
      'Open PR',
      'Copy Link',
    );
  });

  it('shows Show Details button when detailPanel provided', async () => {
    const display: DisplayResult = {
      found: true,
      prNumber: 42,
      prTitle: 'test',
      prUrl: 'https://github.com/test',
      operatingLevel: 2,
      warnings: [],
    };
    const mockPanel = { show: vi.fn(), dispose: vi.fn() };

    await showTraceResult(
      display,
      mockResult,
      '/file.ts',
      1,
      'No PR.',
      mockPanel as never,
    );

    expect(vscode.window.showInformationMessage).toHaveBeenCalledWith(
      'PR #42: test',
      'Open PR',
      'Copy Link',
      'Show Details',
    );
  });

  it('calls detailPanel.show on Show Details click', async () => {
    const display: DisplayResult = {
      found: true,
      prNumber: 42,
      prTitle: 'test',
      prUrl: 'https://github.com/test',
      operatingLevel: 2,
      warnings: [],
    };
    const mockPanel = { show: vi.fn(), dispose: vi.fn() };
    vi.mocked(vscode.window.showInformationMessage).mockResolvedValue(
      'Show Details' as never,
    );

    await showTraceResult(
      display,
      mockResult,
      '/file.ts',
      10,
      'No PR.',
      mockPanel as never,
      20,
    );

    expect(mockPanel.show).toHaveBeenCalledWith('/file.ts', 10, mockResult, 20);
  });

  it('shows warning when PR not found', async () => {
    const display: DisplayResult = {
      found: false,
      commitSha: 'abc123',
      operatingLevel: 0,
      warnings: [],
    };

    await showTraceResult(display, mockResult, '/file.ts', 1, 'No PR found.');

    expect(vscode.window.showWarningMessage).toHaveBeenCalledWith(
      'No PR found. Commit: abc123',
    );
  });

  it('shows uncommitted message when commitSha is zero-hash', async () => {
    const display: DisplayResult = {
      found: false,
      commitSha: '0'.repeat(40),
      operatingLevel: 0,
      warnings: [],
    };

    await showTraceResult(display, mockResult, '/file.ts', 1, 'No PR found.');

    expect(vscode.window.showInformationMessage).toHaveBeenCalledWith(
      'This line has not been committed yet.',
    );
    expect(vscode.window.showWarningMessage).not.toHaveBeenCalled();
  });
});

describe('handleTraceError', () => {
  const mockStatusBar = {
    showError: vi.fn(),
    showLoading: vi.fn(),
    showResult: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows error message for LineLoreError with error severity', () => {
    const error = new LineLoreError('FILE_NOT_FOUND', 'not found', {});
    handleTraceError(error, mockStatusBar as never);

    expect(mockStatusBar.showError).toHaveBeenCalled();
    expect(vscode.window.showErrorMessage).toHaveBeenCalledWith(
      'File not found. It may have been moved or deleted.',
    );
  });

  it('shows warning message for LineLoreError with warning severity', () => {
    const error = new LineLoreError('CLI_NOT_AUTHENTICATED', 'not auth', {});
    handleTraceError(error, mockStatusBar as never);

    expect(vscode.window.showWarningMessage).toHaveBeenCalledWith(
      expect.stringContaining('GitHub CLI not authenticated'),
    );
  });

  it('shows generic error for non-LineLoreError', () => {
    handleTraceError(new Error('random'), mockStatusBar as never);

    expect(mockStatusBar.showError).toHaveBeenCalledWith(
      'An unexpected error occurred.',
    );
    expect(vscode.window.showErrorMessage).toHaveBeenCalledWith(
      'An unexpected error occurred.',
    );
  });
});

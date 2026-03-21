import { describe, it, expect, vi, beforeEach } from 'vitest';
import { executeTracePRRange } from '../tracePRRange.js';
import * as vscode from 'vscode';

const mockShowInfo = vi.fn();
const mockShowWarning = vi.fn();

vi.mock('vscode', () => ({
  window: {
    activeTextEditor: {
      document: { uri: { fsPath: '/workspace/src/config.ts' } },
      selection: {
        start: { line: 9 },
        end: { line: 49 },
        isEmpty: false,
      },
    },
    showInformationMessage: (...args: unknown[]) => mockShowInfo(...args),
    showWarningMessage: (...args: unknown[]) => mockShowWarning(...args),
    showErrorMessage: vi.fn(),
  },
  env: {
    openExternal: vi.fn(),
    clipboard: { writeText: vi.fn() },
  },
  Uri: { parse: (s: string) => s },
}));

describe('executeTracePRRange', () => {
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

  it('passes endLine when selection exists', async () => {
    mockAdapter.trace.mockResolvedValue({
      nodes: [{ type: 'original_commit', sha: 'abc', trackingMethod: 'blame', confidence: 'exact' }],
      operatingLevel: 0,
      featureFlags: { astDiff: false, deepTrace: false, commitGraph: false, graphql: false },
      warnings: [],
    });

    const handler = executeTracePRRange(mockAdapter as never, mockStatusBar as never);
    await handler();

    expect(mockAdapter.trace).toHaveBeenCalledWith('/workspace/src/config.ts', 10, 50);
  });

  it('falls back to single line when no selection', async () => {
    // Override activeTextEditor with empty selection
    const editor = vscode.window.activeTextEditor!;
    Object.defineProperty(editor, 'selection', {
      value: { start: { line: 9 }, end: { line: 9 }, isEmpty: true },
      configurable: true,
    });

    mockAdapter.trace.mockResolvedValue({
      nodes: [{ type: 'original_commit', sha: 'abc', trackingMethod: 'blame', confidence: 'exact' }],
      operatingLevel: 0,
      featureFlags: { astDiff: false, deepTrace: false, commitGraph: false, graphql: false },
      warnings: [],
    });

    const handler = executeTracePRRange(mockAdapter as never, mockStatusBar as never);
    await handler();

    expect(mockAdapter.trace).toHaveBeenCalledWith('/workspace/src/config.ts', 10, undefined);
  });
});

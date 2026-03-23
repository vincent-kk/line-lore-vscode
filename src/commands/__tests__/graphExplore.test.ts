import { describe, it, expect, vi, beforeEach } from 'vitest';
import { executeGraphExplore } from '../graphExplore.js';

vi.mock('vscode', () => ({
  window: {
    showInputBox: vi.fn(),
    showInformationMessage: vi.fn(),
    showWarningMessage: vi.fn(),
    showErrorMessage: vi.fn(),
    activeTextEditor: {
      document: { uri: { fsPath: '/workspace/src/auth.ts' } },
      selection: { active: { line: 41 } },
    },
  },
  Uri: { parse: (s: string) => s },
}));

import * as vscode from 'vscode';

describe('executeGraphExplore', () => {
  const mockAdapter = {
    trace: vi.fn(),
    graph: vi.fn(),
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

  it('does nothing when user cancels input', async () => {
    vi.mocked(vscode.window.showInputBox).mockResolvedValue(undefined);

    const handler = executeGraphExplore(
      mockAdapter as never,
      mockStatusBar as never,
    );
    await handler();

    expect(mockAdapter.graph).not.toHaveBeenCalled();
  });

  it('calls adapter.graph with PR number', async () => {
    vi.mocked(vscode.window.showInputBox).mockResolvedValue('42');
    mockAdapter.graph.mockResolvedValue({ nodes: [], edges: [] });

    const handler = executeGraphExplore(
      mockAdapter as never,
      mockStatusBar as never,
    );
    await handler();

    expect(mockAdapter.graph).toHaveBeenCalledWith({ type: 'pr', number: 42 });
    expect(mockStatusBar.showLoading).toHaveBeenCalled();
  });

  it('shows linked issues count when found', async () => {
    vi.mocked(vscode.window.showInputBox).mockResolvedValue('42');
    mockAdapter.graph.mockResolvedValue({
      nodes: [
        {
          type: 'pull_request',
          trackingMethod: 'api',
          confidence: 'exact',
          prNumber: 42,
        },
        {
          type: 'issue',
          trackingMethod: 'issue-link',
          confidence: 'exact',
          issueNumber: 10,
        },
        {
          type: 'issue',
          trackingMethod: 'issue-link',
          confidence: 'exact',
          issueNumber: 11,
        },
      ],
      edges: [],
    });

    const handler = executeGraphExplore(
      mockAdapter as never,
      mockStatusBar as never,
    );
    await handler();

    expect(vscode.window.showInformationMessage).toHaveBeenCalledWith(
      expect.stringContaining('2 linked issue(s)'),
    );
  });

  it('shows no issues message when none found', async () => {
    vi.mocked(vscode.window.showInputBox).mockResolvedValue('42');
    mockAdapter.graph.mockResolvedValue({
      nodes: [
        {
          type: 'pull_request',
          trackingMethod: 'api',
          confidence: 'exact',
          prNumber: 42,
        },
      ],
      edges: [],
    });

    const handler = executeGraphExplore(
      mockAdapter as never,
      mockStatusBar as never,
    );
    await handler();

    expect(vscode.window.showInformationMessage).toHaveBeenCalledWith(
      expect.stringContaining('No linked issues'),
    );
  });

  it('opens detail panel when provided', async () => {
    vi.mocked(vscode.window.showInputBox).mockResolvedValue('42');
    mockAdapter.graph.mockResolvedValue({ nodes: [], edges: [] });
    const mockPanel = { show: vi.fn(), dispose: vi.fn() };

    const handler = executeGraphExplore(
      mockAdapter as never,
      mockStatusBar as never,
      mockPanel as never,
    );
    await handler();

    expect(mockPanel.show).toHaveBeenCalled();
  });
});

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { executeHealthCheck } from '../healthCheck.js';

vi.mock('vscode', () => ({
  workspace: {
    workspaceFolders: [{ uri: { fsPath: '/workspace' } }],
  },
  window: {
    showInformationMessage: vi.fn(),
    showWarningMessage: vi.fn(),
    showErrorMessage: vi.fn(),
  },
}));

import * as vscode from 'vscode';

describe('executeHealthCheck', () => {
  const mockAdapter = {
    trace: vi.fn(),
    graph: vi.fn(),
    health: vi.fn(),
    clearCache: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows Level 2 info with git version', async () => {
    mockAdapter.health.mockResolvedValue({
      operatingLevel: 2,
      gitVersion: '2.44.0',
      commitGraph: true,
      bloomFilter: true,
      hints: [],
    });

    const handler = executeHealthCheck(mockAdapter as never);
    await handler();

    expect(vscode.window.showInformationMessage).toHaveBeenCalledWith(
      expect.stringContaining('Level 2'),
    );
    expect(vscode.window.showInformationMessage).toHaveBeenCalledWith(
      expect.stringContaining('Git 2.44.0'),
    );
  });

  it('shows Level 1 warning with auth suggestion', async () => {
    mockAdapter.health.mockResolvedValue({
      operatingLevel: 1,
      gitVersion: '2.44.0',
      commitGraph: true,
      bloomFilter: true,
      hints: [],
    });

    const handler = executeHealthCheck(mockAdapter as never);
    await handler();

    expect(vscode.window.showWarningMessage).toHaveBeenCalledWith(
      expect.stringContaining('gh auth login'),
    );
  });

  it('shows Level 0 warning', async () => {
    mockAdapter.health.mockResolvedValue({
      operatingLevel: 0,
      gitVersion: '2.44.0',
      commitGraph: false,
      bloomFilter: false,
      hints: ['Run gh auth login'],
    });

    const handler = executeHealthCheck(mockAdapter as never);
    await handler();

    expect(vscode.window.showWarningMessage).toHaveBeenCalledWith(
      expect.stringContaining('Level 0'),
    );
    expect(vscode.window.showWarningMessage).toHaveBeenCalledWith(
      expect.stringContaining('Run gh auth login'),
    );
  });

  it('shows error on health failure', async () => {
    mockAdapter.health.mockRejectedValue(new Error('fail'));

    const handler = executeHealthCheck(mockAdapter as never);
    await handler();

    expect(vscode.window.showErrorMessage).toHaveBeenCalledWith(
      'Line Lore: Health check failed.',
    );
  });
});

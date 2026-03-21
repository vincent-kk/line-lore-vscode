import { describe, it, expect, vi, beforeEach } from 'vitest';
import { executeClearCache } from '../clearCache.js';

vi.mock('vscode', () => ({
  window: {
    showWarningMessage: vi.fn(),
    showInformationMessage: vi.fn(),
    showErrorMessage: vi.fn(),
  },
}));

import * as vscode from 'vscode';

describe('executeClearCache', () => {
  const mockAdapter = { trace: vi.fn(), graph: vi.fn(), health: vi.fn(), clearCache: vi.fn() };

  beforeEach(() => { vi.clearAllMocks(); });

  it('clears cache after confirmation', async () => {
    vi.mocked(vscode.window.showWarningMessage).mockResolvedValue('Clear Cache' as never);
    mockAdapter.clearCache.mockResolvedValue(undefined);

    const handler = executeClearCache(mockAdapter as never);
    await handler();

    expect(vscode.window.showWarningMessage).toHaveBeenCalledWith(
      'Clear all Line Lore cached data?',
      { modal: true },
      'Clear Cache',
    );
    expect(mockAdapter.clearCache).toHaveBeenCalled();
    expect(vscode.window.showInformationMessage).toHaveBeenCalledWith(
      expect.stringContaining('Cache cleared'),
    );
  });

  it('does nothing when user cancels confirmation', async () => {
    vi.mocked(vscode.window.showWarningMessage).mockResolvedValue(undefined as never);

    const handler = executeClearCache(mockAdapter as never);
    await handler();

    expect(mockAdapter.clearCache).not.toHaveBeenCalled();
  });

  it('shows error when clearCache fails', async () => {
    vi.mocked(vscode.window.showWarningMessage).mockResolvedValue('Clear Cache' as never);
    mockAdapter.clearCache.mockRejectedValue(new Error('fail'));

    const handler = executeClearCache(mockAdapter as never);
    await handler();

    expect(vscode.window.showErrorMessage).toHaveBeenCalledWith('Line Lore: Failed to clear cache.');
  });
});

import * as vscode from 'vscode';
import type { LineLoreAdapter } from '../core/index.js';

export function executeClearCache(
  adapter: LineLoreAdapter,
): () => Promise<void> {
  return async () => {
    const confirm = await vscode.window.showWarningMessage(
      'Clear all Line Lore cached data?',
      { modal: true },
      'Clear Cache',
    );
    if (confirm !== 'Clear Cache') {
      return;
    }

    try {
      await adapter.clearCache();
      void vscode.window.showInformationMessage(
        'Line Lore: Cache cleared. Re-trace lines for fresh results.',
      );
    } catch {
      void vscode.window.showErrorMessage('Line Lore: Failed to clear cache.');
    }
  };
}

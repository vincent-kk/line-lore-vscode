import * as vscode from 'vscode';
import type { PrTracerAdapter } from '../core/index.js';

export function executeClearCache(
  adapter: PrTracerAdapter,
): () => Promise<void> {
  return async () => {
    const confirm = await vscode.window.showWarningMessage(
      'Clear all PR Tracer cached data?',
      { modal: true },
      'Clear Cache',
    );
    if (confirm !== 'Clear Cache') {
      return;
    }

    try {
      await adapter.clearCache();
      void vscode.window.showInformationMessage(
        'PR Tracer: Cache cleared. Re-trace lines for fresh results.',
      );
    } catch {
      void vscode.window.showErrorMessage('PR Tracer: Failed to clear cache.');
    }
  };
}

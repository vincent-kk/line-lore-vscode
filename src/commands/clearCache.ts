import * as vscode from 'vscode';
import type { LineLoreAdapter } from '../core/index.js';

export function executeClearCache(
  adapter: LineLoreAdapter,
): () => Promise<void> {
  return async () => {
    try {
      await adapter.clearCache();
      void vscode.window.showInformationMessage('Line Lore: Cache cleared.');
    } catch {
      void vscode.window.showErrorMessage('Line Lore: Failed to clear cache.');
    }
  };
}

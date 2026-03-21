import * as vscode from 'vscode';
import type { LineLoreAdapter } from '../core/index.js';
import type { StatusBarController } from '../views/index.js';
import { formatTraceResult } from '../core/index.js';
import { showTraceResult, handleTraceError } from './traceHelpers.js';

export function executeTracePR(
  adapter: LineLoreAdapter,
  statusBar: StatusBarController,
): () => Promise<void> {
  return async () => {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      void vscode.window.showWarningMessage('No active editor.');
      return;
    }

    const filePath = editor.document.uri.fsPath;
    const line = editor.selection.active.line + 1;

    statusBar.showLoading();
    try {
      const result = await adapter.trace(filePath, line);
      const display = formatTraceResult(result);
      statusBar.showResult(result.operatingLevel);
      await showTraceResult(display, 'No PR found for this line.');
    } catch (error) {
      handleTraceError(error, statusBar);
    }
  };
}

import * as vscode from 'vscode';
import type { LineLoreAdapter } from '../core/index.js';
import type { StatusBarController, DetailPanelManager } from '../views/index.js';
import type { DecorationController } from '../providers/index.js';
import { formatTraceResult } from '../core/index.js';
import { showTraceResult, handleTraceError } from './traceHelpers.js';

export function executeTracePR(
  adapter: LineLoreAdapter,
  statusBar: StatusBarController,
  detailPanel?: DetailPanelManager,
  decoration?: DecorationController,
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

      if (display.found && display.prNumber && decoration) {
        decoration.showDecoration(editor, line, display.prNumber);
      }

      await showTraceResult(display, result, filePath, line, 'No PR found for this line.', detailPanel);
    } catch (error) {
      handleTraceError(error, statusBar);
    }
  };
}

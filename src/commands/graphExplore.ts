import * as vscode from 'vscode';
import type { LineLoreAdapter } from '../core/index.js';
import type { StatusBarController, DetailPanelManager } from '../views/index.js';
import { formatTraceResult } from '../core/index.js';
import { handleTraceError } from './traceHelpers.js';

export function executeGraphExplore(
  adapter: LineLoreAdapter,
  statusBar: StatusBarController,
  detailPanel?: DetailPanelManager,
): () => Promise<void> {
  return async () => {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      void vscode.window.showWarningMessage('No active editor.');
      return;
    }

    const depthInput = await vscode.window.showInputBox({
      prompt: 'Graph traversal depth (1 = PR+Issues, 2+ = multi-hop)',
      value: '1',
      validateInput: v => {
        const n = parseInt(v, 10);
        if (isNaN(n) || n < 1 || n > 5) { return 'Enter a number between 1 and 5'; }
        return null;
      },
    });

    if (!depthInput) { return; }

    const filePath = editor.document.uri.fsPath;
    const line = editor.selection.active.line + 1;
    const graphDepth = parseInt(depthInput, 10);

    statusBar.showLoading();
    try {
      const result = await adapter.trace(filePath, line, undefined, { graphDepth });
      const display = formatTraceResult(result);
      statusBar.showResult(result.operatingLevel);

      if (detailPanel) {
        detailPanel.show(filePath, line, result);
      }

      if (display.found) {
        const issueNodes = result.nodes.filter(n => n.type === 'issue');
        if (issueNodes.length > 0) {
          void vscode.window.showInformationMessage(
            `Found ${issueNodes.length} linked issue(s) via graph depth ${graphDepth}.`,
          );
        } else {
          void vscode.window.showInformationMessage(
            `PR #${display.prNumber}: No linked issues found at depth ${graphDepth}.`,
          );
        }
      } else {
        void vscode.window.showWarningMessage(
          `No PR found for this line. Commit: ${display.commitSha ?? 'unknown'}`,
        );
      }
    } catch (error) {
      handleTraceError(error, statusBar);
    }
  };
}

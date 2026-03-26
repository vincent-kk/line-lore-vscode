import * as vscode from 'vscode';
import type { PrTracerAdapter } from '../core/index.js';
import type {
  StatusBarController,
  DetailPanelManager,
} from '../views/index.js';
import { handleTraceError } from './traceHelpers.js';

export function executeGraphExplore(
  adapter: PrTracerAdapter,
  statusBar: StatusBarController,
  detailPanel?: DetailPanelManager,
): () => Promise<void> {
  return async () => {
    const prInput = await vscode.window.showInputBox({
      prompt: 'Enter PR number to explore its issue graph',
      validateInput: (v) => {
        const n = parseInt(v, 10);
        if (isNaN(n) || n < 1) {
          return 'Enter a valid PR number';
        }
        return null;
      },
    });

    if (!prInput) {
      return;
    }

    const prNumber = parseInt(prInput, 10);

    statusBar.showLoading();
    try {
      const result = await adapter.graph({ type: 'pr', number: prNumber });

      if (detailPanel) {
        const filePath =
          vscode.window.activeTextEditor?.document.uri.fsPath ?? '';
        const line =
          (vscode.window.activeTextEditor?.selection.active.line ?? 0) + 1;
        detailPanel.show(filePath, line, {
          nodes: result.nodes,
          operatingLevel: 2,
          featureFlags: {
            astDiff: false,
            deepTrace: false,
            commitGraph: false,
            graphql: false,
          },
          warnings: [],
        });
      }

      const issueNodes = result.nodes.filter((n) => n.type === 'issue');
      const prNodes = result.nodes.filter((n) => n.type === 'pull_request');

      if (issueNodes.length > 0) {
        void vscode.window.showInformationMessage(
          `PR #${prNumber}: Found ${issueNodes.length} linked issue(s) and ${prNodes.length} PR(s).`,
        );
      } else {
        void vscode.window.showInformationMessage(
          `PR #${prNumber}: No linked issues found.`,
        );
      }
    } catch (error) {
      handleTraceError(error, statusBar);
    }
  };
}

import * as vscode from 'vscode';
import type { PrTracerAdapter } from '../core/index.js';

export function executeHealthCheck(
  adapter: PrTracerAdapter,
): () => Promise<void> {
  return async () => {
    const cwd = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
    try {
      const report = await adapter.health(cwd);
      const level = report.operatingLevel;
      const hints =
        report.hints.length > 0
          ? `\n\nHints:\n${report.hints.map((h) => `• ${h}`).join('\n')}`
          : '';

      if (level === 2) {
        void vscode.window.showInformationMessage(
          `PR Tracer: Level ${level} — Full API access. Git ${report.gitVersion}.${hints}`,
        );
      } else if (level === 1) {
        void vscode.window.showWarningMessage(
          `PR Tracer: Level ${level} — Limited mode. Run \`gh auth login\` for full access.${hints}`,
        );
      } else {
        void vscode.window.showWarningMessage(
          `PR Tracer: Level ${level} — Git only. No platform CLI detected.${hints}`,
        );
      }
    } catch {
      void vscode.window.showErrorMessage('PR Tracer: Health check failed.');
    }
  };
}

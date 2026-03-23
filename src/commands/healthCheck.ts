import * as vscode from 'vscode';
import type { LineLoreAdapter } from '../core/index.js';

export function executeHealthCheck(
  adapter: LineLoreAdapter,
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
          `Line Lore: Level ${level} — Full API access. Git ${report.gitVersion}.${hints}`,
        );
      } else if (level === 1) {
        void vscode.window.showWarningMessage(
          `Line Lore: Level ${level} — Limited mode. Run \`gh auth login\` for full access.${hints}`,
        );
      } else {
        void vscode.window.showWarningMessage(
          `Line Lore: Level ${level} — Git only. No platform CLI detected.${hints}`,
        );
      }
    } catch {
      void vscode.window.showErrorMessage('Line Lore: Health check failed.');
    }
  };
}

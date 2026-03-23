import * as vscode from 'vscode';
import type { StatusBarController } from '../views/index.js';
import type { DetailPanelManager } from '../views/index.js';
import type { DisplayResult, TraceFullResult } from '../types/index.js';
import { formatErrorMessage } from '../core/index.js';
import { LineLoreError } from '../types/index.js';

export async function showTraceResult(
  display: DisplayResult,
  result: TraceFullResult,
  filePath: string,
  line: number,
  noFoundLabel: string,
  detailPanel?: DetailPanelManager,
  endLine?: number,
  strict?: boolean,
): Promise<void> {
  if (display.found && display.prUrl) {
    const buttons = detailPanel
      ? ['Open PR', 'Copy Link', 'Show Details']
      : ['Open PR', 'Copy Link'];

    const label = strict
      ? `[Strict] PR #${display.prNumber}: ${display.prTitle}`
      : `PR #${display.prNumber}: ${display.prTitle}`;

    const action = await vscode.window.showInformationMessage(
      label,
      ...buttons,
    );
    if (action === 'Open PR') {
      void vscode.env.openExternal(vscode.Uri.parse(display.prUrl));
    } else if (action === 'Copy Link') {
      void vscode.env.clipboard.writeText(display.prUrl);
    } else if (action === 'Show Details' && detailPanel) {
      detailPanel.show(filePath, line, result, endLine);
    }
  } else {
    void vscode.window.showWarningMessage(
      `${noFoundLabel} Commit: ${display.commitSha ?? 'unknown'}`,
    );
  }
}

export function handleTraceError(
  error: unknown,
  statusBar: StatusBarController,
): void {
  if (error instanceof LineLoreError) {
    const info = formatErrorMessage(error.code);
    statusBar.showError(info.message);
    if (info.severity === 'error') {
      void vscode.window.showErrorMessage(info.message);
    } else {
      void vscode.window.showWarningMessage(info.message);
    }
  } else {
    statusBar.showError('An unexpected error occurred.');
    void vscode.window.showErrorMessage('An unexpected error occurred.');
  }
}

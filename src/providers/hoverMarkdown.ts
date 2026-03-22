import * as vscode from 'vscode';
import type { DisplayResult } from '../types/index.js';

export function formatHoverMarkdown(
  display: DisplayResult,
  filePath: string,
  line: number,
): vscode.MarkdownString {
  const md = new vscode.MarkdownString();
  md.isTrusted = true;
  md.supportThemeIcons = true;

  md.appendMarkdown(
    `$(git-pull-request) **PR #${display.prNumber}**: [${display.prTitle}](${display.prUrl})\n\n`,
  );
  md.appendMarkdown('---\n\n');

  const copyArgs = encodeURIComponent(JSON.stringify([display.prUrl]));
  const detailArgs = encodeURIComponent(JSON.stringify([filePath, line]));

  md.appendMarkdown(
    `$(copy) [Copy Link](command:lineLore.copyPrLink?${copyArgs})`,
  );
  md.appendMarkdown('&ensp;');
  md.appendMarkdown(
    `$(book) [Show Details](command:lineLore.showDetails?${detailArgs})`,
  );

  md.appendMarkdown('\n\n---\n\n');
  md.appendMarkdown('$(refresh) [Re-trace](command:lineLore.tracePR)');

  return md;
}

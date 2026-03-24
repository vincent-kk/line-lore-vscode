import * as vscode from 'vscode';
import type { DisplayResult } from '../types/index.js';

export function formatHoverMarkdown(
  display: DisplayResult | null,
  filePath: string,
  line: number,
  originDisplay?: DisplayResult | null,
): vscode.MarkdownString {
  const md = new vscode.MarkdownString();
  md.isTrusted = true;
  md.supportThemeIcons = true;

  const normalFound = display?.found && display?.prUrl;
  const originFound = originDisplay?.found && originDisplay?.prUrl;

  const primaryDisplay = normalFound ? display : originFound ? originDisplay : null;

  if (normalFound && originFound) {
    if (display!.prNumber === originDisplay!.prNumber) {
      // Scenario D: both cached, same PR
      appendPrSection(md, display!);
      md.appendMarkdown(`$(check) Origin and modifier match\n\n`);
    } else {
      // Scenario C: both cached, different PRs
      appendPrSection(md, display!, 'Modifier');
      md.appendMarkdown('---\n\n');
      appendPrSection(md, originDisplay!, 'Origin', '$(git-merge)');
    }
  } else if (normalFound) {
    // Scenario A: only default (change) cached
    appendPrSection(md, display!);
  } else if (originFound) {
    // Scenario B: only origin cached
    appendPrSection(md, originDisplay!, 'Origin', '$(git-merge)');
  }

  md.appendMarkdown('---\n\n');
  appendActionButtons(md, primaryDisplay!, filePath, line);
  md.appendMarkdown('\n\n---\n\n');
  appendTraceButtons(md, filePath, line);

  return md;
}

function escapeMarkdownLinkText(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/\[/g, '\\[')
    .replace(/\]/g, '\\]')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)');
}

function appendPrSection(
  md: vscode.MarkdownString,
  display: DisplayResult,
  label?: string,
  icon = '$(git-pull-request)',
): void {
  const suffix = label ? ` (${label})` : '';
  md.appendMarkdown(`${icon} **PR #${display.prNumber}**${suffix}\n\n`);
  md.appendMarkdown(`[${escapeMarkdownLinkText(display.prTitle ?? '')}](${display.prUrl})\n\n`);
}

function appendActionButtons(
  md: vscode.MarkdownString,
  primaryDisplay: DisplayResult,
  filePath: string,
  line: number,
): void {
  const copyArgs = encodeURIComponent(
    JSON.stringify([primaryDisplay.prUrl]),
  );
  const detailArgs = encodeURIComponent(JSON.stringify([filePath, line]));

  md.appendMarkdown(
    `$(copy) [Copy Link](command:lineLore.copyPrLink?${copyArgs})`,
  );
  md.appendMarkdown('&ensp;');
  md.appendMarkdown(
    `$(book) [Show Details](command:lineLore.showDetails?${detailArgs})`,
  );
}

function appendTraceButtons(
  md: vscode.MarkdownString,
  filePath: string,
  line: number,
): void {
  const retraceArgs = encodeURIComponent(JSON.stringify([filePath, line]));
  md.appendMarkdown(
    `$(refresh) [Re-trace](command:lineLore.traceFromHover?${retraceArgs})`,
  );
  md.appendMarkdown('&ensp;');
  md.appendMarkdown(
    `$(git-merge) [Origin](command:lineLore.traceOriginFromHover?${retraceArgs})`,
  );
}

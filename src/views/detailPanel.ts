import * as vscode from 'vscode';
import type { TraceFullResult } from '../types/index.js';

export class DetailPanelManager {
  private panel: vscode.WebviewPanel | undefined;

  constructor(private readonly extensionUri: vscode.Uri) {}

  show(
    filePath: string,
    line: number,
    result: TraceFullResult,
    endLine?: number,
  ): void {
    if (this.panel) {
      this.panel.reveal(vscode.ViewColumn.Beside);
    } else {
      this.panel = vscode.window.createWebviewPanel(
        'prTracerDetail',
        'PR Tracer — Trace Result',
        vscode.ViewColumn.Beside,
        { enableScripts: false },
      );
      this.panel.onDidDispose(() => {
        this.panel = undefined;
      });
    }

    this.panel.webview.html = this.buildHtml(filePath, line, result, endLine);
  }

  dispose(): void {
    this.panel?.dispose();
    this.panel = undefined;
  }

  private buildHtml(
    filePath: string,
    line: number,
    result: TraceFullResult,
    endLine?: number,
  ): string {
    const fileName = filePath.split('/').pop() ?? filePath;
    const lineLabel = endLine ? `L${line}-L${endLine}` : `L${line}`;
    const nodesHtml = result.nodes
      .map((node) => {
        const icon = this.getNodeIcon(node.type);
        const confidence = node.confidence ? ` [${node.confidence}]` : '';
        const method = node.trackingMethod ? `via ${node.trackingMethod}` : '';

        let detail = '';
        if (node.type === 'pull_request') {
          const prLink = node.prUrl
            ? `<a href="${this.escapeHtml(node.prUrl)}">${this.escapeHtml(node.prUrl)}</a>`
            : '';
          detail = `
          <div class="node-detail">
            ${node.prTitle ? `<div class="pr-title">${this.escapeHtml(node.prTitle)}</div>` : ''}
            ${node.mergedAt ? `<div>Merged: ${this.escapeHtml(node.mergedAt)}</div>` : ''}
            ${prLink ? `<div>URL: ${prLink}</div>` : ''}
          </div>`;
        } else if (node.type === 'issue') {
          detail = `
          <div class="node-detail">
            ${node.issueTitle ? `<div>${this.escapeHtml(node.issueTitle)}</div>` : ''}
            ${node.issueState ? `<div>State: ${node.issueState}</div>` : ''}
            ${node.issueUrl ? `<div>URL: <a href="${this.escapeHtml(node.issueUrl)}">${this.escapeHtml(node.issueUrl)}</a></div>` : ''}
          </div>`;
        }

        return `
        <div class="node">
          <div class="node-header">
            <span class="node-icon">${icon}</span>
            <span class="node-type">${this.formatNodeType(node.type)}</span>
            ${node.sha ? `<span class="sha">${node.sha.substring(0, 7)}</span>` : ''}
            ${node.prNumber ? `<span class="pr-number">#${node.prNumber}</span>` : ''}
            <span class="confidence">${confidence}</span>
          </div>
          ${method ? `<div class="node-method">${method}</div>` : ''}
          ${node.note ? `<div class="node-note">${this.escapeHtml(node.note)}</div>` : ''}
          ${detail}
        </div>`;
      })
      .join('\n');

    const warningsHtml =
      result.warnings.length > 0
        ? result.warnings
            .map((w) => `<div class="warning-item">${this.escapeHtml(w)}</div>`)
            .join('\n')
        : '<div class="no-warnings">(none)</div>';

    const levelLabel =
      result.operatingLevel === 2
        ? 'Full API Access'
        : result.operatingLevel === 1
          ? 'Limited Mode'
          : 'Git Only';

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      font-family: var(--vscode-font-family);
      font-size: var(--vscode-font-size);
      color: var(--vscode-editor-foreground);
      background-color: var(--vscode-editor-background);
      padding: 16px;
      line-height: 1.5;
    }
    h1 { font-size: 1.3em; margin: 0 0 4px 0; color: var(--vscode-foreground); }
    .file-info { color: var(--vscode-descriptionForeground); margin-bottom: 16px; }
    .node {
      border-left: 2px solid var(--vscode-editorWidget-border, #444);
      padding: 8px 12px;
      margin: 8px 0;
    }
    .node-header { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
    .node-icon { font-size: 1.1em; }
    .node-type { font-weight: bold; }
    .sha { font-family: var(--vscode-editor-font-family); color: var(--vscode-textLink-foreground); }
    .pr-number { color: var(--vscode-textLink-foreground); font-weight: bold; }
    .confidence { color: var(--vscode-descriptionForeground); font-size: 0.9em; }
    .node-method { color: var(--vscode-descriptionForeground); font-size: 0.9em; margin-top: 2px; }
    .node-note { color: var(--vscode-descriptionForeground); font-style: italic; margin-top: 2px; }
    .node-detail { margin-top: 4px; }
    .pr-title { font-weight: 600; }
    a { color: var(--vscode-textLink-foreground); }
    a:hover { color: var(--vscode-textLink-activeForeground); }
    .section-title {
      border-top: 1px solid var(--vscode-editorWidget-border, #444);
      margin-top: 16px;
      padding-top: 8px;
      font-weight: bold;
      color: var(--vscode-descriptionForeground);
    }
    .warning-item { color: var(--vscode-editorWarning-foreground, #cca700); }
    .no-warnings { color: var(--vscode-descriptionForeground); }
  </style>
</head>
<body>
  <h1>PR Tracer — Trace Result</h1>
  <div class="file-info">${this.escapeHtml(fileName)} : ${lineLabel}</div>
  ${nodesHtml}
  <div class="section-title">Operating Level</div>
  <div>Level ${result.operatingLevel} (${levelLabel})</div>
  <div class="section-title">Warnings</div>
  ${warningsHtml}
</body>
</html>`;
  }

  private getNodeIcon(type: string): string {
    switch (type) {
      case 'original_commit':
        return '●';
      case 'cosmetic_commit':
        return '○';
      case 'merge_commit':
        return '◆';
      case 'rebased_commit':
        return '◇';
      case 'pull_request':
        return '▸';
      case 'issue':
        return '▹';
      default:
        return '•';
    }
  }

  private formatNodeType(type: string): string {
    return type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  }

  private escapeHtml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
}

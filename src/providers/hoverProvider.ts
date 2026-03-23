import * as vscode from 'vscode';
import type { LineLoreAdapter } from '../core/index.js';
import { formatTraceResult } from '../core/index.js';
import { formatHoverMarkdown } from './hoverMarkdown.js';

export class LineLoreHoverProvider implements vscode.HoverProvider {
  constructor(private adapter: LineLoreAdapter) {}

  async provideHover(
    document: vscode.TextDocument,
    position: vscode.Position,
    token: vscode.CancellationToken,
  ): Promise<vscode.Hover | undefined> {
    const config = vscode.workspace.getConfiguration('lineLore');
    if (!config.get<boolean>('hoverProvider.enabled', true)) {
      return undefined;
    }

    const lineText = document.lineAt(position.line).text;
    if (position.character < lineText.trimEnd().length) {
      return undefined;
    }

    const filePath = document.uri.fsPath;
    const line = position.line + 1;
    const cancelDisposable = {
      disposed: false,
      dispose() {
        this.disposed = true;
      },
    };

    try {
      const result = await Promise.race([
        this.adapter.traceCached(filePath, line),
        new Promise<never>((_, reject) => {
          const listener = token.onCancellationRequested(() => {
            reject(new Error('cancelled'));
          });
          cancelDisposable.dispose = () => {
            cancelDisposable.disposed = true;
            listener.dispose();
          };
        }),
      ]);

      const display = formatTraceResult(result);
      if (display.found && display.prUrl) {
        return new vscode.Hover(formatHoverMarkdown(display, filePath, line));
      }
    } catch {
      // Cache failure or cancellation — fall through to static fallback
    } finally {
      if (!cancelDisposable.disposed) {
        cancelDisposable.dispose();
      }
    }

    const fallbackArgs = encodeURIComponent(JSON.stringify([filePath, line]));
    const md = new vscode.MarkdownString(
      `$(search) [Line Lore: Trace PR](command:lineLore.traceFromHover?${fallbackArgs})`,
    );
    md.isTrusted = true;
    md.supportThemeIcons = true;

    return new vscode.Hover(md);
  }
}

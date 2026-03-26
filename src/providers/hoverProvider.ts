import * as vscode from 'vscode';
import type { PrTracerAdapter } from '../core/index.js';
import type { DisplayResult } from '../types/index.js';
import { formatTraceResult } from '../core/index.js';
import { formatHoverMarkdown } from './hoverMarkdown.js';
import { isUncommittedLine } from '../utils/uncommitted.js';

export class PrTracerHoverProvider implements vscode.HoverProvider {
  constructor(private adapter: PrTracerAdapter) {}

  async provideHover(
    document: vscode.TextDocument,
    position: vscode.Position,
    token: vscode.CancellationToken,
  ): Promise<vscode.Hover | undefined> {
    const config = vscode.workspace.getConfiguration('prTracer');
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
      const [normalSettled, originSettled] = await Promise.race([
        Promise.allSettled([
          this.adapter.traceCached(filePath, line),
          this.adapter.traceCached(filePath, line, 'origin'),
        ]),
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

      const display: DisplayResult | null =
        normalSettled.status === 'fulfilled'
          ? formatTraceResult(normalSettled.value)
          : null;
      const originDisplay: DisplayResult | null =
        originSettled.status === 'fulfilled'
          ? formatTraceResult(originSettled.value)
          : null;

      const normalFound = display?.found && display?.prUrl;
      const originFound = originDisplay?.found && originDisplay?.prUrl;

      if (normalFound || originFound) {
        return new vscode.Hover(
          formatHoverMarkdown(display, filePath, line, originDisplay),
        );
      }
      const bothUncommitted =
        (display === null || isUncommittedLine(display.commitSha)) &&
        (originDisplay === null || isUncommittedLine(originDisplay.commitSha));

      if (bothUncommitted) {
        return undefined;
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
      `$(search) [PR Tracer: Trace PR](command:prTracer.traceFromHover?${fallbackArgs})`,
    );
    md.isTrusted = true;
    md.supportThemeIcons = true;

    return new vscode.Hover(md);
  }
}

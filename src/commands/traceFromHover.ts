import * as vscode from 'vscode';
import type { LineLoreAdapter } from '../core/index.js';
import type {
  StatusBarController,
  DetailPanelManager,
} from '../views/index.js';
import type { DecorationController } from '../providers/index.js';
import type { TraceOptions } from '../types/index.js';
import { formatTraceResult } from '../core/index.js';
import { showTraceResult, handleTraceError } from './traceHelpers.js';

type TraceOverrides = Partial<
  Pick<TraceOptions, 'deep' | 'noAst' | 'noCache' | 'mode'>
>;

export function executeTraceFromHover(
  adapter: LineLoreAdapter,
  statusBar: StatusBarController,
  detailPanel?: DetailPanelManager,
  decoration?: DecorationController,
  overrides?: TraceOverrides,
  noFoundLabel = 'No PR found for this line.',
): (filePath: string, line: number) => Promise<void> {
  const isOriginMode = overrides?.mode === 'origin';
  return async (filePath: string, line: number) => {
    statusBar.showLoading();
    try {
      const result = await adapter.trace(filePath, line, undefined, overrides);
      const display = formatTraceResult(result);
      statusBar.showResult(result.operatingLevel);

      if (decoration && display.found && display.prNumber && display.prUrl) {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
          decoration.showDecoration(
            editor,
            line,
            display.prNumber,
            display.prUrl,
            display.prTitle,
          );
        }
      }

      await showTraceResult(
        display,
        result,
        filePath,
        line,
        noFoundLabel,
        detailPanel,
        undefined,
        isOriginMode,
      );
    } catch (error) {
      handleTraceError(error, statusBar);
    }
  };
}

export const executeTraceOriginFromHover = (
  adapter: LineLoreAdapter,
  statusBar: StatusBarController,
  detailPanel?: DetailPanelManager,
  decoration?: DecorationController,
) =>
  executeTraceFromHover(
    adapter,
    statusBar,
    detailPanel,
    decoration,
    { mode: 'origin' as const },
    'No PR found (origin mode — follows rename/move history).',
  );

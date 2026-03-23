import type { LineLoreAdapter } from '../core/index.js';
import type {
  StatusBarController,
  DetailPanelManager,
} from '../views/index.js';
import type { TraceOptions } from '../types/index.js';
import { formatTraceResult } from '../core/index.js';
import { showTraceResult, handleTraceError } from './traceHelpers.js';

type TraceOverrides = Partial<
  Pick<TraceOptions, 'deep' | 'noAst' | 'noCache' | 'strict'>
>;

export function executeTraceFromHover(
  adapter: LineLoreAdapter,
  statusBar: StatusBarController,
  detailPanel?: DetailPanelManager,
  overrides?: TraceOverrides,
  noFoundLabel = 'No PR found for this line.',
): (filePath: string, line: number) => Promise<void> {
  const strict = !!overrides?.strict;
  return async (filePath: string, line: number) => {
    statusBar.showLoading();
    try {
      const result = await adapter.trace(filePath, line, undefined, overrides);
      const display = formatTraceResult(result);
      statusBar.showResult(result.operatingLevel);

      await showTraceResult(
        display,
        result,
        filePath,
        line,
        noFoundLabel,
        detailPanel,
        undefined,
        strict,
      );
    } catch (error) {
      handleTraceError(error, statusBar);
    }
  };
}

export const executeTraceStrictFromHover = (
  adapter: LineLoreAdapter,
  statusBar: StatusBarController,
  detailPanel?: DetailPanelManager,
) =>
  executeTraceFromHover(
    adapter,
    statusBar,
    detailPanel,
    { strict: true },
    'No PR found (strict mode — no rename/move detection).',
  );

import type { LineLoreAdapter } from '../core/index.js';
import type {
  StatusBarController,
  DetailPanelManager,
} from '../views/index.js';
import { formatTraceResult } from '../core/index.js';
import { showTraceResult, handleTraceError } from './traceHelpers.js';

export function executeTraceFromHover(
  adapter: LineLoreAdapter,
  statusBar: StatusBarController,
  detailPanel?: DetailPanelManager,
): (filePath: string, line: number) => Promise<void> {
  return async (filePath: string, line: number) => {
    statusBar.showLoading();
    try {
      const result = await adapter.trace(filePath, line);
      const display = formatTraceResult(result);
      statusBar.showResult(result.operatingLevel);

      await showTraceResult(
        display,
        result,
        filePath,
        line,
        'No PR found for this line.',
        detailPanel,
      );
    } catch (error) {
      handleTraceError(error, statusBar);
    }
  };
}

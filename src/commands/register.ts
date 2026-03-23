import * as vscode from 'vscode';
import type { LineLoreAdapter } from '../core/index.js';
import type {
  StatusBarController,
  DetailPanelManager,
} from '../views/index.js';
import { executeTracePR } from './tracePR.js';
import { executeTracePRRange } from './tracePRRange.js';
import { executeHealthCheck } from './healthCheck.js';
import { executeClearCache } from './clearCache.js';
import { executeGraphExplore } from './graphExplore.js';
import { executeTraceFromHover } from './traceFromHover.js';
import { handleTraceError } from './traceHelpers.js';

export function registerCommands(
  context: vscode.ExtensionContext,
  adapter: LineLoreAdapter,
  statusBar: StatusBarController,
  detailPanel?: DetailPanelManager,
): void {
  context.subscriptions.push(
    vscode.commands.registerCommand(
      'lineLore.tracePR',
      executeTracePR(adapter, statusBar, detailPanel),
    ),
    vscode.commands.registerCommand(
      'lineLore.tracePRRange',
      executeTracePRRange(adapter, statusBar, detailPanel),
    ),
    vscode.commands.registerCommand(
      'lineLore.healthCheck',
      executeHealthCheck(adapter),
    ),
    vscode.commands.registerCommand(
      'lineLore.clearCache',
      executeClearCache(adapter),
    ),
    vscode.commands.registerCommand(
      'lineLore.graphExplore',
      executeGraphExplore(adapter, statusBar, detailPanel),
    ),
    vscode.commands.registerCommand(
      'lineLore.traceFromHover',
      executeTraceFromHover(adapter, statusBar, detailPanel),
    ),
    vscode.commands.registerCommand('lineLore.copyPrLink', (prUrl: string) => {
      void vscode.env.clipboard.writeText(prUrl);
      void vscode.window.showInformationMessage('PR link copied!');
    }),
    vscode.commands.registerCommand(
      'lineLore.showDetails',
      async (filePath: string, line: number) => {
        if (!detailPanel) {
          return;
        }
        statusBar.showLoading();
        try {
          const result = await adapter.trace(filePath, line);
          statusBar.showResult(result.operatingLevel);
          detailPanel.show(filePath, line, result);
        } catch (error) {
          handleTraceError(error, statusBar);
        }
      },
    ),
  );
}

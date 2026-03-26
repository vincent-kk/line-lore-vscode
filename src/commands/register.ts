import * as vscode from 'vscode';
import type { PrTracerAdapter } from '../core/index.js';
import type {
  StatusBarController,
  DetailPanelManager,
} from '../views/index.js';
import type { DecorationController } from '../providers/index.js';
import { executeTracePR } from './tracePR.js';
import { executeTracePRRange } from './tracePRRange.js';
import { executeHealthCheck } from './healthCheck.js';
import { executeClearCache } from './clearCache.js';
import { executeGraphExplore } from './graphExplore.js';
import {
  executeTraceFromHover,
  executeTraceOriginFromHover,
} from './traceFromHover.js';
import { handleTraceError } from './traceHelpers.js';

export function registerCommands(
  context: vscode.ExtensionContext,
  adapter: PrTracerAdapter,
  statusBar: StatusBarController,
  detailPanel?: DetailPanelManager,
  decoration?: DecorationController,
): void {
  context.subscriptions.push(
    vscode.commands.registerCommand(
      'prTracer.tracePR',
      executeTracePR(adapter, statusBar, detailPanel),
    ),
    vscode.commands.registerCommand(
      'prTracer.tracePRRange',
      executeTracePRRange(adapter, statusBar, detailPanel),
    ),
    vscode.commands.registerCommand(
      'prTracer.healthCheck',
      executeHealthCheck(adapter),
    ),
    vscode.commands.registerCommand(
      'prTracer.clearCache',
      executeClearCache(adapter),
    ),
    vscode.commands.registerCommand(
      'prTracer.graphExplore',
      executeGraphExplore(adapter, statusBar, detailPanel),
    ),
    vscode.commands.registerCommand(
      'prTracer.traceFromHover',
      executeTraceFromHover(adapter, statusBar, detailPanel, decoration),
    ),
    vscode.commands.registerCommand(
      'prTracer.traceOriginFromHover',
      executeTraceOriginFromHover(adapter, statusBar, detailPanel, decoration),
    ),
    vscode.commands.registerCommand('prTracer.copyPrLink', (prUrl: string) => {
      void vscode.env.clipboard.writeText(prUrl);
      void vscode.window.showInformationMessage('PR link copied!');
    }),
    vscode.commands.registerCommand(
      'prTracer.showDetails',
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

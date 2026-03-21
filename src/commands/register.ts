import * as vscode from 'vscode';
import type { LineLoreAdapter } from '../core/index.js';
import type { StatusBarController, DetailPanelManager } from '../views/index.js';
import type { DecorationController } from '../providers/index.js';
import { executeTracePR } from './tracePR.js';
import { executeTracePRRange } from './tracePRRange.js';
import { executeHealthCheck } from './healthCheck.js';
import { executeClearCache } from './clearCache.js';
import { executeGraphExplore } from './graphExplore.js';

export function registerCommands(
  context: vscode.ExtensionContext,
  adapter: LineLoreAdapter,
  statusBar: StatusBarController,
  detailPanel?: DetailPanelManager,
  decoration?: DecorationController,
): void {
  context.subscriptions.push(
    vscode.commands.registerCommand('lineLore.tracePR', executeTracePR(adapter, statusBar, detailPanel, decoration)),
    vscode.commands.registerCommand('lineLore.tracePRRange', executeTracePRRange(adapter, statusBar, detailPanel, decoration)),
    vscode.commands.registerCommand('lineLore.healthCheck', executeHealthCheck(adapter)),
    vscode.commands.registerCommand('lineLore.clearCache', executeClearCache(adapter)),
    vscode.commands.registerCommand('lineLore.graphExplore', executeGraphExplore(adapter, statusBar, detailPanel)),
  );
}

import * as vscode from 'vscode';
import type { LineLoreAdapter } from '../core/index.js';
import type { StatusBarController } from '../views/index.js';
import { executeTracePR } from './tracePR.js';
import { executeTracePRRange } from './tracePRRange.js';
import { executeHealthCheck } from './healthCheck.js';
import { executeClearCache } from './clearCache.js';

export function registerCommands(
  context: vscode.ExtensionContext,
  adapter: LineLoreAdapter,
  statusBar: StatusBarController,
): void {
  context.subscriptions.push(
    vscode.commands.registerCommand('lineLore.tracePR', executeTracePR(adapter, statusBar)),
    vscode.commands.registerCommand('lineLore.tracePRRange', executeTracePRRange(adapter, statusBar)),
    vscode.commands.registerCommand('lineLore.healthCheck', executeHealthCheck(adapter)),
    vscode.commands.registerCommand('lineLore.clearCache', executeClearCache(adapter)),
  );
}

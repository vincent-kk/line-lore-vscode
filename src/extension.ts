import * as vscode from 'vscode';
import { detectGitRepo } from './utils/gitDetector.js';
import { PrTracerAdapter } from './core/index.js';
import { registerCommands } from './commands/index.js';
import { registerProviders, DecorationController } from './providers/index.js';
import { StatusBarController, DetailPanelManager } from './views/index.js';

export async function activate(
  context: vscode.ExtensionContext,
): Promise<void> {
  const config = vscode.workspace.getConfiguration('prTracer');
  if (!config.get<boolean>('enabled', true)) {
    return;
  }

  const folders = vscode.workspace.workspaceFolders;
  if (!folders) {
    return;
  }

  let hasGit = false;
  for (const folder of folders) {
    if (await detectGitRepo(folder)) {
      hasGit = true;
      break;
    }
  }

  if (!hasGit) {
    return;
  }

  void vscode.commands.executeCommand(
    'setContext',
    'prTracer.gitDetected',
    true,
  );

  const adapter = new PrTracerAdapter();
  const statusBar = new StatusBarController();
  statusBar.create();

  const detailPanel = new DetailPanelManager(context.extensionUri);
  const decoration = new DecorationController();

  context.subscriptions.push(
    { dispose: () => statusBar.dispose() },
    { dispose: () => detailPanel.dispose() },
    { dispose: () => decoration.dispose() },
    vscode.commands.registerCommand('prTracer.clearDecoration', (key?: string) => {
      if (key) {
        decoration.clearOne(key);
      } else {
        decoration.clear();
      }
    }),
    vscode.commands.registerCommand('prTracer.clearAllDecorations', () => {
      decoration.clear();
    }),
    vscode.commands.registerCommand('prTracer.statusBarMenu', async () => {
      const pick = await vscode.window.showQuickPick(
        [
          { label: '$(search) Health Check', command: 'prTracer.healthCheck' },
          { label: '$(close-all) Clear All Decorations', command: 'prTracer.clearAllDecorations' },
          { label: '$(trash) Clear Cache', command: 'prTracer.clearCache' },
        ],
        { placeHolder: 'PR Tracer' },
      );
      if (pick) {
        void vscode.commands.executeCommand(pick.command);
      }
    }),
  );

  registerCommands(context, adapter, statusBar, detailPanel, decoration);
  registerProviders(context, adapter);

  try {
    const cwd = folders[0]?.uri.fsPath;
    const report = await adapter.health(cwd);
    statusBar.showPersistentLevel(report.operatingLevel);
  } catch {
    statusBar.showPersistentLevel(0);
  }
}

export function deactivate(): void {}

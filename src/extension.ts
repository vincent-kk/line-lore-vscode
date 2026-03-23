import * as vscode from 'vscode';
import { detectGitRepo } from './utils/gitDetector.js';
import { LineLoreAdapter } from './core/index.js';
import { registerCommands } from './commands/index.js';
import { registerProviders } from './providers/index.js';
import { StatusBarController, DetailPanelManager } from './views/index.js';

export async function activate(
  context: vscode.ExtensionContext,
): Promise<void> {
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
    'lineLore.gitDetected',
    true,
  );

  const adapter = new LineLoreAdapter();
  const statusBar = new StatusBarController();
  statusBar.create();

  const detailPanel = new DetailPanelManager(context.extensionUri);

  context.subscriptions.push(
    { dispose: () => statusBar.dispose() },
    { dispose: () => detailPanel.dispose() },
  );

  registerCommands(context, adapter, statusBar, detailPanel);
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

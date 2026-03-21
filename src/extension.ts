import * as vscode from 'vscode';
import { detectGitRepo } from './utils/gitDetector.js';
import { LineLoreAdapter } from './core/index.js';
import { registerCommands } from './commands/index.js';
import { registerProviders } from './providers/index.js';
import { StatusBarController } from './views/index.js';

export async function activate(context: vscode.ExtensionContext): Promise<void> {
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

  void vscode.commands.executeCommand('setContext', 'lineLore.gitDetected', true);

  const adapter = new LineLoreAdapter();
  const statusBar = new StatusBarController();
  statusBar.create();

  context.subscriptions.push({ dispose: () => statusBar.dispose() });

  registerCommands(context, adapter, statusBar);
  registerProviders(context);
}

export function deactivate(): void {}

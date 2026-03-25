import * as vscode from 'vscode';
import { detectGitRepo } from './utils/gitDetector.js';
import { LineLoreAdapter } from './core/index.js';
import { registerCommands } from './commands/index.js';
import { registerProviders, DecorationController } from './providers/index.js';
import { StatusBarController, DetailPanelManager } from './views/index.js';

export async function activate(
  context: vscode.ExtensionContext,
): Promise<void> {
  const config = vscode.workspace.getConfiguration('lineLore');
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
    'lineLore.gitDetected',
    true,
  );

  const adapter = new LineLoreAdapter();
  const statusBar = new StatusBarController();
  statusBar.create();

  const detailPanel = new DetailPanelManager(context.extensionUri);
  const decoration = new DecorationController();

  context.subscriptions.push(
    { dispose: () => statusBar.dispose() },
    { dispose: () => detailPanel.dispose() },
    { dispose: () => decoration.dispose() },
    vscode.commands.registerCommand('lineLore.clearDecoration', (key?: string) => {
      if (key) {
        decoration.clearOne(key);
      } else {
        decoration.clear();
      }
    }),
    vscode.commands.registerCommand('lineLore.clearAllDecorations', () => {
      decoration.clear();
    }),
    vscode.commands.registerCommand('lineLore.statusBarMenu', async () => {
      const pick = await vscode.window.showQuickPick(
        [
          { label: '$(search) Health Check', command: 'lineLore.healthCheck' },
          { label: '$(close-all) Clear All Decorations', command: 'lineLore.clearAllDecorations' },
          { label: '$(trash) Clear Cache', command: 'lineLore.clearCache' },
        ],
        { placeHolder: 'Line Lore' },
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

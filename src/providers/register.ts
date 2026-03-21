import * as vscode from 'vscode';
import { LineLoreHoverProvider } from './hoverProvider.js';

export function registerProviders(
  context: vscode.ExtensionContext,
): void {
  const config = vscode.workspace.getConfiguration('lineLore');
  if (!config.get<boolean>('hoverProvider.enabled', true)) {
    return;
  }

  context.subscriptions.push(
    vscode.languages.registerHoverProvider('*', new LineLoreHoverProvider()),
  );
}

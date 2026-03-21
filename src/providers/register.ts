import * as vscode from 'vscode';
import { LineLoreHoverProvider } from './hoverProvider.js';

export class ProviderManager {
  private hoverDisposable: vscode.Disposable | undefined;

  register(context: vscode.ExtensionContext): void {
    this.updateHoverProvider(context);

    context.subscriptions.push(
      vscode.workspace.onDidChangeConfiguration(e => {
        if (e.affectsConfiguration('lineLore.hoverProvider.enabled')) {
          this.updateHoverProvider(context);
        }
      }),
    );
  }

  private updateHoverProvider(context: vscode.ExtensionContext): void {
    const enabled = vscode.workspace
      .getConfiguration('lineLore')
      .get<boolean>('hoverProvider.enabled', true);

    if (enabled && !this.hoverDisposable) {
      this.hoverDisposable = vscode.languages.registerHoverProvider(
        '*',
        new LineLoreHoverProvider(),
      );
      context.subscriptions.push(this.hoverDisposable);
    } else if (!enabled && this.hoverDisposable) {
      this.hoverDisposable.dispose();
      this.hoverDisposable = undefined;
    }
  }
}

export function registerProviders(context: vscode.ExtensionContext): void {
  const manager = new ProviderManager();
  manager.register(context);
}

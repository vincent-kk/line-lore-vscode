import * as vscode from 'vscode';
import type { PrTracerAdapter } from '../core/index.js';
import { PrTracerHoverProvider } from './hoverProvider.js';

export class ProviderManager {
  private hoverDisposable: vscode.Disposable | undefined;

  constructor(private adapter: PrTracerAdapter) {}

  register(context: vscode.ExtensionContext): void {
    this.updateHoverProvider(context);

    context.subscriptions.push(
      vscode.workspace.onDidChangeConfiguration((e) => {
        if (e.affectsConfiguration('prTracer.hoverProvider.enabled')) {
          this.updateHoverProvider(context);
        }
      }),
    );
  }

  private updateHoverProvider(context: vscode.ExtensionContext): void {
    const enabled = vscode.workspace
      .getConfiguration('prTracer')
      .get<boolean>('hoverProvider.enabled', true);

    if (enabled && !this.hoverDisposable) {
      this.hoverDisposable = vscode.languages.registerHoverProvider(
        '*',
        new PrTracerHoverProvider(this.adapter),
      );
      context.subscriptions.push(this.hoverDisposable);
    } else if (!enabled && this.hoverDisposable) {
      this.hoverDisposable.dispose();
      this.hoverDisposable = undefined;
    }
  }
}

export function registerProviders(
  context: vscode.ExtensionContext,
  adapter: PrTracerAdapter,
): void {
  const manager = new ProviderManager(adapter);
  manager.register(context);
}

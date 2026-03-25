import * as vscode from 'vscode';

interface LensEntry {
  uri: string;
  filePath: string;
  line: number;
  prNumber: number;
  prUrl: string;
  prTitle: string;
}

export class DecorationController implements vscode.CodeLensProvider {
  private readonly _onDidChangeCodeLenses = new vscode.EventEmitter<void>();
  readonly onDidChangeCodeLenses = this._onDidChangeCodeLenses.event;

  private registration: vscode.Disposable | undefined;
  private closeListener: vscode.Disposable | undefined;
  private lenses = new Map<string, LensEntry>();

  constructor() {
    this.registration = vscode.languages.registerCodeLensProvider(
      { scheme: 'file' },
      this,
    );
    this.closeListener = vscode.window.tabGroups.onDidChangeTabs((e) => {
      for (const tab of e.closed) {
        const input = tab.input as { uri?: vscode.Uri } | undefined;
        if (input?.uri) {
          this.clearByUri(input.uri.toString());
        }
      }
    });
  }

  private static key(uri: string, line: number): string {
    return `${uri}:${line}`;
  }

  provideCodeLenses(document: vscode.TextDocument): vscode.CodeLens[] {
    const docUri = document.uri.toString();
    const result: vscode.CodeLens[] = [];

    for (const entry of this.lenses.values()) {
      if (entry.uri !== docUri) {
        continue;
      }
      const range = new vscode.Range(entry.line - 1, 0, entry.line - 1, 0);
      const key = DecorationController.key(entry.uri, entry.line);
      result.push(
        new vscode.CodeLens(range, {
          title: `$(git-pull-request) PR #${entry.prNumber}: ${entry.prTitle}`,
          command: 'vscode.open',
          arguments: [vscode.Uri.parse(entry.prUrl)],
        }),
        new vscode.CodeLens(range, {
          title: ' $(info) ',
          tooltip: 'Show Details',
          command: 'lineLore.showDetails',
          arguments: [entry.filePath, entry.line],
        }),
        new vscode.CodeLens(range, {
          title: ' $(close) ',
          tooltip: 'Dismiss',
          command: 'lineLore.clearDecoration',
          arguments: [key],
        }),
      );
    }

    return result;
  }

  showDecoration(
    editor: vscode.TextEditor,
    line: number,
    prNumber: number,
    prUrl: string,
    prTitle?: string,
  ): void {
    const config = vscode.workspace.getConfiguration('lineLore');
    if (!config.get<boolean>('inlineDecoration.enabled', true)) {
      return;
    }

    const uri = editor.document.uri.toString();
    const key = DecorationController.key(uri, line);

    this.lenses.set(key, {
      uri,
      filePath: editor.document.uri.fsPath,
      line,
      prNumber,
      prUrl,
      prTitle: prTitle ?? '',
    });
    this._onDidChangeCodeLenses.fire();
  }

  clearOne(key: string): void {
    if (this.lenses.delete(key)) {
      this._onDidChangeCodeLenses.fire();
    }
  }

  clearByUri(uri: string): void {
    let changed = false;
    for (const [key, entry] of this.lenses) {
      if (entry.uri === uri) {
        this.lenses.delete(key);
        changed = true;
      }
    }
    if (changed) {
      this._onDidChangeCodeLenses.fire();
    }
  }

  clear(): void {
    if (this.lenses.size > 0) {
      this.lenses.clear();
      this._onDidChangeCodeLenses.fire();
    }
  }

  dispose(): void {
    this.clear();
    this.closeListener?.dispose();
    this.registration?.dispose();
    this._onDidChangeCodeLenses.dispose();
  }
}

import * as vscode from 'vscode';

export class DecorationController {
  private decorationType: vscode.TextEditorDecorationType;
  private removeTimer: ReturnType<typeof setTimeout> | undefined;
  private selectionListener: vscode.Disposable | undefined;
  private activeEditor: vscode.TextEditor | undefined;

  constructor() {
    this.decorationType = vscode.window.createTextEditorDecorationType({
      after: {
        color: new vscode.ThemeColor('editorCodeLens.foreground'),
        fontStyle: 'italic',
        margin: '0 0 0 1em',
      },
    });
  }

  showDecoration(editor: vscode.TextEditor, line: number, prNumber: number): void {
    const config = vscode.workspace.getConfiguration('lineLore');
    if (!config.get<boolean>('inlineDecoration.enabled', true)) {
      return;
    }

    this.clear();
    this.activeEditor = editor;

    const range = new vscode.Range(line - 1, 0, line - 1, 0);
    editor.setDecorations(this.decorationType, [
      {
        range,
        renderOptions: {
          after: { contentText: `← PR #${prNumber}` },
        },
      },
    ]);

    const timeoutSec = config.get<number>('inlineDecoration.timeout', 30);
    if (timeoutSec > 0) {
      this.removeTimer = setTimeout(() => this.clear(), timeoutSec * 1000);
    }

    this.selectionListener = vscode.window.onDidChangeTextEditorSelection(e => {
      if (e.textEditor === editor) {
        this.clear();
      }
    });
  }

  clear(): void {
    if (this.removeTimer !== undefined) {
      clearTimeout(this.removeTimer);
      this.removeTimer = undefined;
    }
    this.selectionListener?.dispose();
    this.selectionListener = undefined;
    if (this.activeEditor) {
      this.activeEditor.setDecorations(this.decorationType, []);
      this.activeEditor = undefined;
    }
  }

  dispose(): void {
    this.clear();
    this.decorationType.dispose();
  }
}

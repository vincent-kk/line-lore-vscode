import * as vscode from 'vscode';

export class LineLoreHoverProvider implements vscode.HoverProvider {
  provideHover(
    _document: vscode.TextDocument,
    _position: vscode.Position,
    _token: vscode.CancellationToken,
  ): vscode.Hover | undefined {
    const config = vscode.workspace.getConfiguration('lineLore');
    if (!config.get<boolean>('hoverProvider.enabled', true)) {
      return undefined;
    }

    const md = new vscode.MarkdownString(
      '$(search) [Line Lore: Trace PR](command:lineLore.tracePR)',
    );
    md.isTrusted = true;
    md.supportThemeIcons = true;

    return new vscode.Hover(md);
  }
}

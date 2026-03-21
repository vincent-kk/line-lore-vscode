import * as vscode from 'vscode';

export async function detectGitRepo(
  folder: vscode.WorkspaceFolder,
): Promise<boolean> {
  const gitUri = vscode.Uri.joinPath(folder.uri, '.git');
  try {
    await vscode.workspace.fs.stat(gitUri);
    return true;
  } catch {
    return false;
  }
}

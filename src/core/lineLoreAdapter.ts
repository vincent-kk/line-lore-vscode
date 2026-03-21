import * as vscode from 'vscode';
import { trace, graph, health, clearCache } from '@lumy-pack/line-lore';
import type { TraceOptions, TraceFullResult, GraphOptions, GraphResult, HealthReport, OperatingLevel } from '../types/index.js';

export class LineLoreAdapter {
  async trace(
    filePath: string,
    line: number,
    endLine?: number,
    overrides?: Partial<Pick<TraceOptions, 'deep' | 'noAst' | 'noCache'>>,
  ): Promise<TraceFullResult> {
    const config = vscode.workspace.getConfiguration('lineLore');
    const cwd = vscode.workspace.getWorkspaceFolder(vscode.Uri.file(filePath))?.uri.fsPath;
    const options: TraceOptions = {
      file: filePath,
      line,
      ...(endLine !== undefined && { endLine }),
      ...(cwd !== undefined && { cwd }),
      deep: overrides?.deep ?? config.get<boolean>('trace.deep', false),
      noAst: overrides?.noAst ?? config.get<boolean>('trace.noAst', false),
      noCache: overrides?.noCache ?? config.get<boolean>('trace.noCache', false),
    };
    return trace(options);
  }

  async graph(options: GraphOptions): Promise<GraphResult> {
    return graph(options);
  }

  async health(cwd?: string): Promise<HealthReport & { operatingLevel: OperatingLevel }> {
    return health(cwd ? { cwd } : undefined);
  }

  async clearCache(): Promise<void> {
    return clearCache();
  }
}

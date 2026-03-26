import * as vscode from 'vscode';
import { trace, graph, health, clearCache } from '@lumy-pack/line-lore';
import type {
  TraceMode,
  TraceOptions,
  TraceFullResult,
  GraphOptions,
  GraphResult,
  HealthReport,
  OperatingLevel,
} from '../types/index.js';

export class PrTracerAdapter {
  async trace(
    filePath: string,
    line: number,
    endLine?: number,
    overrides?: Partial<
      Pick<TraceOptions, 'deep' | 'noAst' | 'noCache' | 'mode'>
    >,
  ): Promise<TraceFullResult> {
    const config = vscode.workspace.getConfiguration('prTracer');
    const cwd = vscode.workspace.getWorkspaceFolder(vscode.Uri.file(filePath))
      ?.uri.fsPath;
    const options: TraceOptions = {
      file: filePath,
      line,
      ...(endLine !== undefined && { endLine }),
      ...(cwd !== undefined && { cwd }),
      deep: overrides?.deep ?? config.get<boolean>('trace.deep', false),
      noAst: overrides?.noAst ?? config.get<boolean>('trace.noAst', false),
      noCache:
        overrides?.noCache ?? config.get<boolean>('trace.noCache', false),
      mode: overrides?.mode ?? 'change',
    };
    return trace(options);
  }

  async graph(options: GraphOptions): Promise<GraphResult> {
    return graph(options);
  }

  async health(
    cwd?: string,
  ): Promise<HealthReport & { operatingLevel: OperatingLevel }> {
    return health(cwd ? { cwd } : undefined);
  }

  async traceCached(
    filePath: string,
    line: number,
    mode?: TraceMode,
  ): Promise<TraceFullResult> {
    const cwd = vscode.workspace.getWorkspaceFolder(vscode.Uri.file(filePath))
      ?.uri.fsPath;
    return trace({
      file: filePath,
      line,
      ...(cwd !== undefined && { cwd }),
      cacheOnly: true,
      mode: mode ?? 'change',
    });
  }

  async clearCache(): Promise<void> {
    return clearCache();
  }
}

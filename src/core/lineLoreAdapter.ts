import * as vscode from 'vscode';
import { trace, health, clearCache } from '@lumy-pack/line-lore';
import type { TraceOptions, TraceFullResult, HealthReport, OperatingLevel } from '../types/index.js';

export class LineLoreAdapter {
  async trace(
    filePath: string,
    line: number,
    endLine?: number,
    overrides?: Partial<Pick<TraceOptions, 'deep' | 'noAst' | 'noCache' | 'graphDepth'>>,
  ): Promise<TraceFullResult> {
    const config = vscode.workspace.getConfiguration('lineLore');
    const options: TraceOptions = {
      file: filePath,
      line,
      ...(endLine !== undefined && { endLine }),
      deep: overrides?.deep ?? config.get<boolean>('trace.deep', false),
      noAst: overrides?.noAst ?? config.get<boolean>('trace.noAst', false),
      noCache: overrides?.noCache ?? config.get<boolean>('trace.noCache', false),
      ...(overrides?.graphDepth !== undefined && { graphDepth: overrides.graphDepth }),
    };
    return trace(options);
  }

  async health(cwd?: string): Promise<HealthReport & { operatingLevel: OperatingLevel }> {
    return health(cwd ? { cwd } : undefined);
  }

  async clearCache(): Promise<void> {
    return clearCache();
  }
}

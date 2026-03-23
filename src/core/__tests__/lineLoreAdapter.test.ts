import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LineLoreAdapter } from '../lineLoreAdapter.js';

vi.mock('vscode', () => ({
  workspace: {
    getConfiguration: vi.fn(() => ({
      get: vi.fn((key: string, defaultValue: unknown) => defaultValue),
    })),
    getWorkspaceFolder: vi.fn(() => ({ uri: { fsPath: '/workspace' } })),
  },
  Uri: {
    file: vi.fn((path: string) => ({ fsPath: path })),
  },
}));

vi.mock('@lumy-pack/line-lore', () => ({
  trace: vi.fn(),
  health: vi.fn(),
  clearCache: vi.fn(),
}));

import { trace, health, clearCache } from '@lumy-pack/line-lore';
import * as vscode from 'vscode';

const mockTrace = vi.mocked(trace);
const mockHealth = vi.mocked(health);
const mockClearCache = vi.mocked(clearCache);

describe('LineLoreAdapter', () => {
  let adapter: LineLoreAdapter;

  beforeEach(() => {
    adapter = new LineLoreAdapter();
    vi.clearAllMocks();
  });

  describe('trace', () => {
    it('calls library trace with file and line', async () => {
      const mockResult = {
        nodes: [],
        operatingLevel: 0 as const,
        featureFlags: {
          astDiff: false,
          deepTrace: false,
          commitGraph: false,
          graphql: false,
        },
        warnings: [],
      };
      mockTrace.mockResolvedValue(mockResult);

      const result = await adapter.trace('/workspace/src/auth.ts', 42);

      expect(mockTrace).toHaveBeenCalledWith({
        file: '/workspace/src/auth.ts',
        line: 42,
        cwd: '/workspace',
        deep: false,
        noAst: false,
        noCache: false,
        mode: 'change',
      });
      expect(result).toBe(mockResult);
    });

    it('passes endLine when provided', async () => {
      mockTrace.mockResolvedValue({
        nodes: [],
        operatingLevel: 0 as const,
        featureFlags: {
          astDiff: false,
          deepTrace: false,
          commitGraph: false,
          graphql: false,
        },
        warnings: [],
      });

      await adapter.trace('/workspace/src/auth.ts', 10, 50);

      expect(mockTrace).toHaveBeenCalledWith(
        expect.objectContaining({
          line: 10,
          endLine: 50,
        }),
      );
    });

    it('applies overrides over config defaults', async () => {
      mockTrace.mockResolvedValue({
        nodes: [],
        operatingLevel: 0 as const,
        featureFlags: {
          astDiff: false,
          deepTrace: false,
          commitGraph: false,
          graphql: false,
        },
        warnings: [],
      });

      await adapter.trace('/workspace/src/auth.ts', 42, undefined, {
        deep: true,
      });

      expect(mockTrace).toHaveBeenCalledWith(
        expect.objectContaining({ deep: true }),
      );
    });

    it('reads config values for trace options', async () => {
      const mockGet = vi.fn((key: string) => {
        if (key === 'trace.deep') {
          return true;
        }
        if (key === 'trace.noAst') {
          return true;
        }
        if (key === 'trace.noCache') {
          return false;
        }
        return undefined;
      });
      vi.mocked(vscode.workspace.getConfiguration).mockReturnValue({
        get: mockGet,
      } as never);

      mockTrace.mockResolvedValue({
        nodes: [],
        operatingLevel: 0 as const,
        featureFlags: {
          astDiff: false,
          deepTrace: false,
          commitGraph: false,
          graphql: false,
        },
        warnings: [],
      });

      await adapter.trace('/workspace/src/auth.ts', 42);

      expect(mockTrace).toHaveBeenCalledWith(
        expect.objectContaining({ deep: true, noAst: true, noCache: false }),
      );
    });
  });

  describe('health', () => {
    it('calls library health with cwd', async () => {
      const mockResult = {
        commitGraph: true,
        bloomFilter: true,
        gitVersion: '2.44.0',
        hints: [],
        operatingLevel: 2 as const,
      };
      mockHealth.mockResolvedValue(mockResult);

      const result = await adapter.health('/workspace/repo');

      expect(mockHealth).toHaveBeenCalledWith({ cwd: '/workspace/repo' });
      expect(result).toBe(mockResult);
    });

    it('calls library health without cwd when not provided', async () => {
      const mockResult = {
        commitGraph: false,
        bloomFilter: false,
        gitVersion: '2.44.0',
        hints: [],
        operatingLevel: 0 as const,
      };
      mockHealth.mockResolvedValue(mockResult);

      const result = await adapter.health();

      expect(mockHealth).toHaveBeenCalledWith(undefined);
      expect(result).toBe(mockResult);
    });
  });

  describe('clearCache', () => {
    it('calls library clearCache', async () => {
      mockClearCache.mockResolvedValue(undefined);

      await adapter.clearCache();

      expect(mockClearCache).toHaveBeenCalledOnce();
    });
  });
});

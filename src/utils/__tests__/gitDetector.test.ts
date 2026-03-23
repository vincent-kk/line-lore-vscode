import { describe, it, expect, vi, beforeEach } from 'vitest';
import { detectGitRepo } from '../gitDetector.js';

const mockStat = vi.fn();

vi.mock('vscode', () => ({
  workspace: {
    fs: { stat: (...args: unknown[]) => mockStat(...args) },
  },
  Uri: {
    joinPath: vi.fn((_base: unknown, segment: string) => ({
      path: `/workspace/${segment}`,
    })),
  },
}));

describe('detectGitRepo', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns true when .git exists', async () => {
    mockStat.mockResolvedValue({});

    const result = await detectGitRepo({
      uri: { fsPath: '/workspace' },
    } as never);

    expect(result).toBe(true);
  });

  it('returns false when .git does not exist', async () => {
    mockStat.mockRejectedValue(new Error('not found'));

    const result = await detectGitRepo({
      uri: { fsPath: '/workspace' },
    } as never);

    expect(result).toBe(false);
  });
});

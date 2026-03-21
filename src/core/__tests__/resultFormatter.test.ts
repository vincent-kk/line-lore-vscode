import { describe, it, expect } from 'vitest';
import { formatTraceResult, formatErrorMessage } from '../resultFormatter.js';
import { LineLoreErrorCode } from '@lumy-pack/line-lore';
import type { TraceFullResult } from '../../types/index.js';

describe('formatTraceResult', () => {
  it('extracts PR node when found', () => {
    const result: TraceFullResult = {
      nodes: [
        {
          type: 'original_commit',
          sha: 'abc123',
          trackingMethod: 'blame',
          confidence: 'exact',
        },
        {
          type: 'pull_request',
          trackingMethod: 'api',
          confidence: 'exact',
          prNumber: 42,
          prTitle: 'feat: add auth',
          prUrl: 'https://github.com/org/repo/pull/42',
          mergedAt: '2025-03-15T10:30:00Z',
        },
      ],
      operatingLevel: 2,
      featureFlags: { astDiff: true, deepTrace: false, commitGraph: true, issueGraph: false, graphql: true },
      warnings: [],
    };

    const display = formatTraceResult(result);
    expect(display.found).toBe(true);
    expect(display.prNumber).toBe(42);
    expect(display.prTitle).toBe('feat: add auth');
    expect(display.prUrl).toBe('https://github.com/org/repo/pull/42');
    expect(display.commitSha).toBe('abc123');
    expect(display.operatingLevel).toBe(2);
    expect(display.warnings).toEqual([]);
    expect(display.confidence).toBe('exact');
    expect(display.mergedAt).toBe('2025-03-15T10:30:00Z');
  });

  it('returns found=false when no PR node', () => {
    const result: TraceFullResult = {
      nodes: [
        {
          type: 'original_commit',
          sha: 'def456',
          trackingMethod: 'blame',
          confidence: 'exact',
        },
      ],
      operatingLevel: 0,
      featureFlags: { astDiff: false, deepTrace: false, commitGraph: false, issueGraph: false, graphql: false },
      warnings: ['GitHub CLI not detected'],
    };

    const display = formatTraceResult(result);
    expect(display.found).toBe(false);
    expect(display.prNumber).toBeUndefined();
    expect(display.commitSha).toBe('def456');
    expect(display.operatingLevel).toBe(0);
    expect(display.warnings).toEqual(['GitHub CLI not detected']);
  });

  it('handles empty nodes array', () => {
    const result: TraceFullResult = {
      nodes: [],
      operatingLevel: 0,
      featureFlags: { astDiff: false, deepTrace: false, commitGraph: false, issueGraph: false, graphql: false },
      warnings: [],
    };

    const display = formatTraceResult(result);
    expect(display.found).toBe(false);
    expect(display.commitSha).toBeUndefined();
  });
});

describe('formatErrorMessage', () => {
  describe('Tier 1 — Primary codes', () => {
    it('maps NOT_GIT_REPO', () => {
      const info = formatErrorMessage(LineLoreErrorCode.NOT_GIT_REPO);
      expect(info.message).toBe('This file is not in a Git repository.');
      expect(info.code).toBe('NOT_GIT_REPO');
      expect(info.severity).toBe('error');
    });

    it('maps FILE_NOT_FOUND', () => {
      const info = formatErrorMessage(LineLoreErrorCode.FILE_NOT_FOUND);
      expect(info.message).toBe('File not found. It may have been moved or deleted.');
      expect(info.severity).toBe('error');
    });

    it('maps INVALID_LINE', () => {
      const info = formatErrorMessage(LineLoreErrorCode.INVALID_LINE);
      expect(info.message).toBe('Invalid line number. The file may have changed.');
      expect(info.severity).toBe('error');
    });

    it('maps GIT_BLAME_FAILED', () => {
      const info = formatErrorMessage(LineLoreErrorCode.GIT_BLAME_FAILED);
      expect(info.message).toBe('Git blame failed for this line. The file may be uncommitted.');
      expect(info.severity).toBe('error');
    });

    it('maps CLI_NOT_AUTHENTICATED', () => {
      const info = formatErrorMessage(LineLoreErrorCode.CLI_NOT_AUTHENTICATED);
      expect(info.message).toBe('GitHub CLI not authenticated. Run `gh auth login` for full access.');
      expect(info.severity).toBe('warning');
    });

    it('maps API_RATE_LIMITED', () => {
      const info = formatErrorMessage(LineLoreErrorCode.API_RATE_LIMITED);
      expect(info.message).toBe('GitHub API rate limit reached. Try again later.');
      expect(info.severity).toBe('error');
    });

    it('maps API_REQUEST_FAILED', () => {
      const info = formatErrorMessage(LineLoreErrorCode.API_REQUEST_FAILED);
      expect(info.message).toBe('GitHub API request failed. Check your network connection.');
      expect(info.severity).toBe('error');
    });
  });

  describe('Tier 2 — Category: Git operations', () => {
    const gitCodes = [
      LineLoreErrorCode.GIT_COMMAND_FAILED,
      LineLoreErrorCode.GIT_TIMEOUT,
      LineLoreErrorCode.ANCESTRY_PATH_FAILED,
      LineLoreErrorCode.INVALID_REMOTE_URL,
    ] as const;

    for (const code of gitCodes) {
      it(`maps ${code} to Git operations category`, () => {
        const info = formatErrorMessage(code);
        expect(info.message).toContain('A Git operation failed');
        expect(info.message).toContain(code);
        expect(info.severity).toBe('error');
      });
    }
  });

  describe('Tier 2 — Category: AST analysis', () => {
    const astCodes = [
      LineLoreErrorCode.AST_PARSE_FAILED,
      LineLoreErrorCode.AST_ENGINE_UNAVAILABLE,
    ] as const;

    for (const code of astCodes) {
      it(`maps ${code} to AST analysis category`, () => {
        const info = formatErrorMessage(code);
        expect(info.message).toContain('Code analysis unavailable');
        expect(info.message).toContain(code);
        expect(info.severity).toBe('warning');
      });
    }
  });

  describe('Tier 2 — Category: Platform/API', () => {
    const platformCodes = [
      LineLoreErrorCode.PLATFORM_UNKNOWN,
      LineLoreErrorCode.CLI_NOT_INSTALLED,
      LineLoreErrorCode.GRAPHQL_NOT_SUPPORTED,
      LineLoreErrorCode.ENTERPRISE_VERSION_UNSUPPORTED,
    ] as const;

    for (const code of platformCodes) {
      it(`maps ${code} to Platform category`, () => {
        const info = formatErrorMessage(code);
        expect(info.message).toContain('Platform feature unavailable');
        expect(info.message).toContain(code);
        expect(info.severity).toBe('warning');
      });
    }
  });

  describe('Tier 2 — Category: Graph traversal', () => {
    const graphCodes = [
      LineLoreErrorCode.ISSUE_NOT_FOUND,
      LineLoreErrorCode.GRAPH_DEPTH_EXCEEDED,
      LineLoreErrorCode.GRAPH_CYCLE_DETECTED,
    ] as const;

    for (const code of graphCodes) {
      it(`maps ${code} to Graph traversal category`, () => {
        const info = formatErrorMessage(code);
        expect(info.message).toContain('Issue graph traversal encountered a problem');
        expect(info.message).toContain(code);
        expect(info.severity).toBe('warning');
      });
    }
  });

  describe('Tier 3 — Fallback', () => {
    const fallbackCodes = [
      LineLoreErrorCode.PATCH_ID_NO_MATCH,
      LineLoreErrorCode.CACHE_CORRUPTED,
      LineLoreErrorCode.UNKNOWN,
    ] as const;

    for (const code of fallbackCodes) {
      it(`maps ${code} to fallback`, () => {
        const info = formatErrorMessage(code);
        expect(info.message).toContain('An unexpected error occurred');
        expect(info.message).toContain(code);
        expect(info.severity).toBe('error');
      });
    }

    it('handles unknown future codes', () => {
      const info = formatErrorMessage('FUTURE_CODE');
      expect(info.message).toContain('An unexpected error occurred');
      expect(info.message).toContain('FUTURE_CODE');
      expect(info.severity).toBe('error');
    });
  });
});

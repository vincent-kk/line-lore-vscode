import { LineLoreErrorCode } from '@lumy-pack/line-lore';
import type {
  TraceFullResult,
  DisplayResult,
  ErrorInfo,
} from '../types/index.js';

export function formatTraceResult(result: TraceFullResult): DisplayResult {
  const prNode = result.nodes.find((n) => n.type === 'pull_request');

  if (prNode) {
    return {
      found: true,
      prNumber: prNode.prNumber,
      prTitle: prNode.prTitle,
      prUrl: prNode.prUrl,
      commitSha: result.nodes.find((n) => n.sha)?.sha,
      operatingLevel: result.operatingLevel,
      warnings: result.warnings,
      confidence: prNode.confidence,
      trackingMethod: prNode.trackingMethod,
      mergedAt: prNode.mergedAt,
    };
  }

  const commitNode =
    result.nodes.find((n) => n.type === 'original_commit') ?? result.nodes[0];
  return {
    found: false,
    commitSha: commitNode?.sha,
    operatingLevel: result.operatingLevel,
    warnings: result.warnings,
  };
}

const tier1Messages: Record<string, ErrorInfo> = {
  [LineLoreErrorCode.NOT_GIT_REPO]: {
    message: 'This file is not in a Git repository.',
    code: LineLoreErrorCode.NOT_GIT_REPO,
    severity: 'error',
  },
  [LineLoreErrorCode.FILE_NOT_FOUND]: {
    message: 'File not found. It may have been moved or deleted.',
    code: LineLoreErrorCode.FILE_NOT_FOUND,
    severity: 'error',
  },
  [LineLoreErrorCode.INVALID_LINE]: {
    message: 'Invalid line number. The file may have changed.',
    code: LineLoreErrorCode.INVALID_LINE,
    severity: 'error',
  },
  [LineLoreErrorCode.GIT_BLAME_FAILED]: {
    message: 'Git blame failed for this line. The file may be uncommitted.',
    code: LineLoreErrorCode.GIT_BLAME_FAILED,
    severity: 'error',
  },
  [LineLoreErrorCode.CLI_NOT_AUTHENTICATED]: {
    message:
      'GitHub CLI not authenticated. Run `gh auth login` for full access.',
    code: LineLoreErrorCode.CLI_NOT_AUTHENTICATED,
    severity: 'warning',
  },
  [LineLoreErrorCode.API_RATE_LIMITED]: {
    message: 'GitHub API rate limit reached. Try again later.',
    code: LineLoreErrorCode.API_RATE_LIMITED,
    severity: 'error',
  },
  [LineLoreErrorCode.API_REQUEST_FAILED]: {
    message: 'GitHub API request failed. Check your network connection.',
    code: LineLoreErrorCode.API_REQUEST_FAILED,
    severity: 'error',
  },
};

const tier2Categories: Array<{
  codes: string[];
  message: string;
  severity: ErrorInfo['severity'];
}> = [
  {
    codes: [
      LineLoreErrorCode.GIT_COMMAND_FAILED,
      LineLoreErrorCode.GIT_TIMEOUT,
      LineLoreErrorCode.ANCESTRY_PATH_FAILED,
      LineLoreErrorCode.INVALID_REMOTE_URL,
    ],
    message: 'A Git operation failed. Check your repository state.',
    severity: 'error',
  },
  {
    codes: [
      LineLoreErrorCode.AST_PARSE_FAILED,
      LineLoreErrorCode.AST_ENGINE_UNAVAILABLE,
    ],
    message: 'Code analysis unavailable. Results may be less precise.',
    severity: 'warning',
  },
  {
    codes: [
      LineLoreErrorCode.PLATFORM_UNKNOWN,
      LineLoreErrorCode.CLI_NOT_INSTALLED,
      LineLoreErrorCode.GRAPHQL_NOT_SUPPORTED,
      LineLoreErrorCode.ENTERPRISE_VERSION_UNSUPPORTED,
    ],
    message: 'Platform feature unavailable. Some features may be limited.',
    severity: 'warning',
  },
  {
    codes: [
      LineLoreErrorCode.ISSUE_NOT_FOUND,
      LineLoreErrorCode.GRAPH_DEPTH_EXCEEDED,
      LineLoreErrorCode.GRAPH_CYCLE_DETECTED,
    ],
    message: 'Issue graph traversal encountered a problem.',
    severity: 'warning',
  },
];

export function formatErrorMessage(code: string): ErrorInfo {
  const tier1 = tier1Messages[code];
  if (tier1) {
    return tier1;
  }

  for (const category of tier2Categories) {
    if (category.codes.includes(code)) {
      return {
        message: `${category.message} (Code: ${code})`,
        code,
        severity: category.severity,
      };
    }
  }

  return {
    message: `An unexpected error occurred. (Code: ${code})`,
    code,
    severity: 'error',
  };
}

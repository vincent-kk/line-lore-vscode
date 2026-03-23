import type {
  OperatingLevel,
  Confidence,
  TrackingMethod,
} from '@lumy-pack/line-lore';

export type {
  TraceNode,
  TraceNodeType,
  TraceMode,
  TraceOptions,
  TraceFullResult,
  OperatingLevel,
  FeatureFlags,
  HealthReport,
  Confidence,
  TrackingMethod,
  GraphOptions,
  GraphResult,
} from '@lumy-pack/line-lore';

export { LineLoreError, LineLoreErrorCode } from '@lumy-pack/line-lore';

export interface DisplayResult {
  found: boolean;
  prNumber?: number;
  prTitle?: string;
  prUrl?: string;
  commitSha?: string;
  operatingLevel: OperatingLevel;
  warnings: string[];
  confidence?: Confidence;
  trackingMethod?: TrackingMethod;
  mergedAt?: string;
}

export interface ErrorInfo {
  message: string;
  code: string;
  severity: 'error' | 'warning' | 'info';
}

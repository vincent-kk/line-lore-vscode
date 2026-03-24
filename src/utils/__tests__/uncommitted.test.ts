import { describe, it, expect } from 'vitest';
import { isUncommittedLine } from '../uncommitted.js';

describe('isUncommittedLine', () => {
  it('returns true for the git zero hash', () => {
    expect(isUncommittedLine('0'.repeat(40))).toBe(true);
  });

  it('returns true for undefined', () => {
    expect(isUncommittedLine(undefined)).toBe(true);
  });

  it('returns true for empty string', () => {
    expect(isUncommittedLine('')).toBe(true);
  });

  it('returns false for a real commit sha', () => {
    expect(isUncommittedLine('abc123def456')).toBe(false);
  });

  it('returns false for a partial zero hash (not 40 chars)', () => {
    expect(isUncommittedLine('0000000')).toBe(false);
  });
});

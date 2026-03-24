const GIT_ZERO_HASH = '0'.repeat(40);

export function isUncommittedLine(
  commitSha: string | undefined,
): boolean {
  return !commitSha || commitSha === GIT_ZERO_HASH;
}

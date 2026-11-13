/** Shared sponsorship-clause stripping; callers own any additional short-label rules. */
export function stripEventSponsorClause(name: string): string {
  return (name || '').trim().replace(/\s+(presented|driven|sponsored)\s+by\s+.*$/i, '').trim();
}
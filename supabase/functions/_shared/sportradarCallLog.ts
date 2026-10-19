/** Log actual provider requests only, never internal function dispatches.
 * Parse public endpoint identity, not credentials or query parameters, so each
 * request (including failed attempts) contributes exactly one countable line.
 */
export function logSportradarCall(url: string, endpoint: string): void {
  const parts = new URL(url).pathname.split('/').filter(Boolean);
  const golf = parts.indexOf('golf');
  const tour = parts[golf + 2] === 'v3' ? '-' : parts[golf + 2] ?? '-';
  const tournaments = parts.indexOf('tournaments');
  const candidate = tournaments >= 0 ? parts[tournaments + 1] : undefined;
  const tournamentId = candidate && !candidate.endsWith('.json') ? candidate : '-';
  console.log(`[SR_CALL] ${endpoint} ${tour} ${tournamentId}`);
}
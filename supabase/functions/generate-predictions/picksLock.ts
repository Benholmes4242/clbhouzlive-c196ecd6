/**
 * picksLock — CB54: picks lock at the first tee.
 *
 * Picks may be created or regenerated only while the tournament's
 * sr_tournaments.status is 'scheduled' or 'created' — the same predicate
 * validate-prediction-field-status uses for alternate promotion. After that
 * the stored row is served as-is, whatever its logic_version, and a
 * tournament with no row stays without picks.
 *
 * The client (src/features/tourhub/hooks/useAIPredictions.ts) carries the
 * same predicate inline — Deno deploys bundle only supabase/functions, so
 * the two copies must be kept in sync, like PREDICTION_LOGIC_VERSION.
 *
 * Pure module: no Deno or URL imports, so vitest can import it directly.
 */

export function tournamentAcceptsNewPicks(status: string | null | undefined): boolean {
  return status === 'scheduled' || status === 'created';
}

export type PicksLockDecision = 'generate' | 'serve-stored' | 'no-picks';

export function picksLockDecision(
  status: string | null | undefined,
  hasStoredRow: boolean,
): PicksLockDecision {
  if (tournamentAcceptsNewPicks(status)) return 'generate';
  return hasStoredRow ? 'serve-stored' : 'no-picks';
}

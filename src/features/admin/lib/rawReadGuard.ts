/**
 * PostgREST returns AT MOST 2000 rows, whatever `.limit()` says.
 *
 * A response of exactly the cap is the boundary announcing itself: it is
 * almost certainly a truncated read, and every count, distinct-user figure or
 * bucket derived from it is WRONG rather than approximate.
 *
 * Call this immediately after any raw select that a metric is computed from.
 * Development throws so it is found on the first run; production logs an error
 * naming the caller and the window so it is found in the logs rather than in a
 * quietly plausible number six months later.
 */
export const POSTGREST_ROW_CAP = 2000;

export function assertNotTruncated(
  hook: string,
  window: string,
  rowCount: number | null | undefined,
): void {
  if ((rowCount ?? 0) < POSTGREST_ROW_CAP) return;
  const message =
    `[admin raw read] ${hook} received exactly ${POSTGREST_ROW_CAP} rows for window "${window}". ` +
    `This is the PostgREST cap: the read is truncated and any figure derived from it is false. ` +
    `Aggregate in Postgres behind an admin-gated RPC instead.`;
  if (import.meta.env.DEV) throw new Error(message);
  console.error(message);
}

/**
 * Pure lifecycle rules for tournament-live-sync (BRIEF_TOUR_PLAYOFF_AND_SHORTENED_EVENTS §1).
 * No Deno or network imports, so vitest exercises the exact rules the function runs.
 *
 * - The live poll covers inprogress plus every PLAYOFF and SUSPENDED status.
 * - The stale date auto-close covers 'inprogress' ONLY: a playoff or suspended
 *   event is never closed by date.
 * - A feed playoff/suspended status is written through and is never replaced
 *   with 'inprogress' while the feed still says it.
 * - winner_id is set only for exactly one position-1 row with strokes > 0.
 */
export const PLAYOFF_STATUSES = ['playoff', 'inplayoff', 'in_playoff'] as const;
export const SUSPENDED_STATUSES = ['suspended', 'delayed', 'weather', 'holdup'] as const;
export const LIVE_POLL_STATUSES: string[] = ['inprogress', ...PLAYOFF_STATUSES, ...SUSPENDED_STATUSES];
export const STALE_AUTO_CLOSE_STATUSES: string[] = ['inprogress'];
export const CLOSED_FEED_STATUSES = ['closed', 'complete', 'completed', 'official'];

const HELD = new Set<string>([...PLAYOFF_STATUSES, ...SUSPENDED_STATUSES]);

export function isHeldStatus(status: string | null | undefined): boolean {
  return HELD.has((status ?? '').trim().toLowerCase());
}

/**
 * The status to write for a non-closing feed status, or null for no change.
 * Held (playoff/suspended) feed statuses are written through; 'inprogress'
 * is written only when the feed itself says inprogress (play resumed).
 */
export function statusToWrite(feedStatus: string | null | undefined, dbStatus: string | null | undefined): string | null {
  const feed = (feedStatus ?? '').trim().toLowerCase();
  const db = (dbStatus ?? '').trim().toLowerCase();
  if (!feed) return null;
  if (isHeldStatus(feed)) return feed === db ? null : feed;
  if (feed === 'inprogress' && isHeldStatus(db)) return 'inprogress';
  return null;
}

/** Exactly one sole leader with strokes, or null (a tie at position 1 names nobody). */
export function soleWinnerSrId(rows: Array<{ position?: number | null; strokes?: number | null; sr_id?: string | null }>): string | null {
  const leaders = rows.filter((r) => r.position === 1 && typeof r.strokes === 'number' && r.strokes > 0);
  if (leaders.length !== 1) return null;
  return leaders[0].sr_id ?? null;
}

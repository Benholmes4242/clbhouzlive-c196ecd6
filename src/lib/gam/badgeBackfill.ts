/**
 * THE BACKFILL WINDOW -- the one place that knows which badge timestamps are
 * migration artefacts rather than moments.
 *
 * gam_user_badges.earned_at was written in bulk when the badge evaluator first
 * ran over historic rounds: 201 rows for 14 members between
 * 2026-07-24 11:59:02.143Z and 2026-07-24 13:20:17.479Z, plus a 15-row tail for
 * 4 members between 15:52:46.765Z and 16:23:35.128Z the same afternoon. Fourteen
 * people did not reach tiers inside eighty minutes of each other, so rendering
 * "Tier 3 reached JUL 2026" against those rows states a fact that did not
 * happen -- and a fabricated fact is worse than an absent one.
 *
 * SUPPRESSION IS WINDOWED, NOT GLOBAL. Anything earned since that run carries a
 * real timestamp and renders normally, so the sheet fills in honestly as members
 * actually earn things.
 *
 * A REAL attained-at for the backfilled rows would have to be derived from the
 * round that triggered each badge. That derivation is NOT attempted here or
 * anywhere: until it exists, those rows carry no date at all.
 *
 * Bounds are INCLUSIVE and stated as exact instants, never as the calendar day:
 * badges genuinely earned on 24 Jul 2026 outside these windows keep their date.
 *
 * THE GAP ROW IS NOT A LEAK. There is a 2.5-hour gap between the two runs
 * (13:20:17.479Z - 15:52:46.765Z) and exactly one row falls inside it: badge
 * 'founder', one member, 14:58:28.163529Z. It was checked and DELIBERATELY not
 * suppressed -- a single row for a single member between two bulk runs is a
 * manual grant, so its timestamp is a real moment and renders. If you see a date
 * on a 24 Jul 2026 row and expected none, this is why; the rule is not leaking.
 */
const WINDOWS: ReadonlyArray<readonly [number, number]> = [
  [Date.parse('2026-07-24T11:59:02.143Z'), Date.parse('2026-07-24T13:20:17.479Z')],
  [Date.parse('2026-07-24T15:52:46.765Z'), Date.parse('2026-07-24T16:23:35.128Z')],
];

/**
 * True when a timestamp falls inside the bulk evaluation run and therefore
 * records when the row was WRITTEN, not when the thing was achieved. Callers
 * must render nothing at all for these -- no label, no blank slot, no
 * "date unknown", which is itself a claim about the data.
 */
export function isBackfillStamp(iso: string | null | undefined): boolean {
  if (!iso) return false;
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return false;
  return WINDOWS.some(([from, to]) => t >= from && t <= to);
}

/** The timestamp when it is a real moment, null when it is a backfill stamp. */
export function attainedAt(iso: string | null | undefined): string | null {
  if (!iso || isBackfillStamp(iso)) return null;
  return iso;
}

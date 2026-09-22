// ONE GATE, ONE MEANING (BRIEF_BADGE_HISTORY_GATE).
//
// A member-facing notice must be CAUSED by a round they just played. The crown
// path has tested this since BRIEF_LEGENDS_RUNAWAY; badges now test it too, with
// the SAME constant and the SAME helper — never a second age constant.
//
// The test is play_date, never created_at: a row created today off a 2021 round
// is indistinguishable from a fresh one by sync time alone.
//
// 2 days, not 1: a round played Saturday and synced Monday morning is still news
// to the member. A round from March is not.
export const LEGEND_NOTIFY_MAX_AGE_DAYS = 2;

export type FreshnessReason = 'fresh' | 'missing' | 'unparseable' | 'stale';

export type Freshness = {
  fresh: boolean;
  reason: FreshnessReason;
  ageDays: number | null;
};

/**
 * Is this triggering round's play_date recent enough to justify telling the
 * member something? Missing, null, unparseable and absent all answer no — an
 * unknown date is not a fresh one.
 */
export function playDateFreshness(
  playDate: string | null | undefined,
  now: Date = new Date(),
): Freshness {
  if (!playDate) return { fresh: false, reason: 'missing', ageDays: null };
  const played = Date.parse(`${String(playDate).slice(0, 10)}T00:00:00Z`);
  if (!Number.isFinite(played)) return { fresh: false, reason: 'unparseable', ageDays: null };
  const todayUtc = Date.parse(`${now.toISOString().slice(0, 10)}T00:00:00Z`);
  const ageDays = Math.floor((todayUtc - played) / 86400_000);
  if (ageDays > LEGEND_NOTIFY_MAX_AGE_DAYS) return { fresh: false, reason: 'stale', ageDays };
  return { fresh: true, reason: 'fresh', ageDays };
}

export function isPlayDateFreshForNotice(
  playDate: string | null | undefined,
  now: Date = new Date(),
): boolean {
  return playDateFreshness(playDate, now).fresh;
}

/**
 * timelineUtils — shared date/week helpers for schedule-v2.
 *
 * Deduped from useSeasonTimeline.ts and useMergedSchedule.ts, which carried
 * byte-identical copies. Weeks run Monday→Sunday (BRIEF_TOUR_SCHEDULE_REBUILT
 * §3); the old month bucketing is gone.
 */

export function todayNoonMs(): number {
  const d = new Date();
  return new Date(`${d.toISOString().split('T')[0]}T12:00:00Z`).getTime();
}

export function daysUntil(startDate: string): number | null {
  if (!startDate) return null;
  const t = new Date(`${startDate}T12:00:00Z`).getTime();
  return Math.max(0, Math.ceil((t - todayNoonMs()) / 86_400_000));
}

// ─── Week helpers (BRIEF_TOUR_SCHEDULE_REBUILT §3) ───────────────────────
// Golf weeks run Monday→Sunday. All maths is noon-UTC so a member's device
// timezone can never push an event into the neighbouring week.

/** Monday (noon UTC) of the week containing the ISO date. */
export function weekMonday(iso: string): Date {
  const d = new Date(`${iso.slice(0, 10)}T12:00:00Z`);
  const offset = (d.getUTCDay() + 6) % 7; // days since Monday (Mon=0)
  d.setUTCDate(d.getUTCDate() - offset);
  return d;
}

/** yyyy-MM-dd key of the week's Monday — the WeekGroup key. */
export function weekKey(iso: string): string {
  return weekMonday(iso).toISOString().slice(0, 10);
}

/** The week key containing `now` (device-local today, UTC-noon anchored). */
export function currentWeekKey(now: Date = new Date()): string {
  return weekKey(now.toISOString().slice(0, 10));
}

/** Current round (1–4) from a leader's round scores: latest non-null + 1. */
export function currentRoundFromScores(l: {
  round1: number | null;
  round2: number | null;
  round3: number | null;
  round4: number | null;
}): number | null {
  const played = [l.round1, l.round2, l.round3, l.round4].filter(
    (v) => v != null,
  ).length;
  return Math.min(4, played + 1);
}

export type WeekRelation = 'last' | 'this' | 'next' | 'other';

export function weekRelation(key: string, now: Date = new Date()): WeekRelation {
  const cur = currentWeekKey(now);
  if (key === cur) return 'this';
  const WEEK_MS = 7 * 86_400_000;
  const monday = new Date(`${key}T12:00:00Z`).getTime();
  const curMs = new Date(`${cur}T12:00:00Z`).getTime();
  if (monday === curMs - WEEK_MS) return 'last';
  if (monday === curMs + WEEK_MS) return 'next';
  return 'other';
}

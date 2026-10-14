/**
 * Formatters for the Analytics lenses (BRIEF_ANALYTICS). Null is not zero:
 * every helper that can receive a missing figure returns '-' for it.
 */

export const DASH = '-';

export function num(n: number | null | undefined): string {
  return n == null ? DASH : n.toLocaleString('en-GB');
}

export function pct(n: number | null | undefined): string {
  return n == null ? DASH : `${n}%`;
}

/** round(100 * a / b), or null when either side is missing or b is 0. */
export function ratio(a: number | null | undefined, b: number | null | undefined): number | null {
  if (a == null || b == null || b === 0) return null;
  return Math.round((100 * a) / b);
}

/** Screen time: 45s, 12m, 2h 5m. Floored. */
export function dur(secs: number | null | undefined): string {
  if (secs == null) return DASH;
  const s = Math.max(0, Math.floor(secs));
  if (s < 60) return `${s}s`;
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  return `${Math.floor(s / 3600)}h ${Math.floor((s % 3600) / 60)}m`;
}

/** Live "on it for": 48s, 2m 40s, 1h 5m. */
export function onFor(secs: number | null | undefined): string {
  if (secs == null) return DASH;
  const s = Math.max(0, Math.floor(secs));
  if (s < 60) return `${s}s`;
  if (s < 3600) return `${Math.floor(s / 60)}m ${s % 60}s`;
  return `${Math.floor(s / 3600)}h ${Math.floor((s % 3600) / 60)}m`;
}

/** After-round wait: <1m, 12m, 3h 10m, 2d 4h. */
export function wait(secs: number | null | undefined): string {
  if (secs == null) return DASH;
  const s = Math.max(0, Math.floor(secs));
  if (s < 60) return '<1m';
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  if (s < 48 * 3600) return `${Math.floor(s / 3600)}h ${Math.floor((s % 3600) / 60)}m`;
  return `${Math.floor(s / 86400)}d ${Math.floor((s % 86400) / 3600)}h`;
}

/** Percentage change; null when there is no comparable prior. */
export function delta(cur: number | null | undefined, prior: number | null | undefined): number | null {
  if (cur == null || prior == null || prior === 0) return null;
  return Math.round((100 * (cur - prior)) / prior);
}

export function deltaLabel(d: number): string {
  return d > 0 ? `+${d}%` : `${d}%`;
}

export const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/**
 * '2026-09-15' -> '15 Sep'. RPC dates are CALENDAR dates: split the string,
 * never pass it through new Date(), or a timezone shifts the label a day.
 */
export function dateLabel(iso: string | null | undefined): string {
  if (!iso) return DASH;
  const [, m, d] = iso.slice(0, 10).split('-');
  const mi = Number(m) - 1;
  if (!d || !(mi >= 0 && mi < 12)) return DASH;
  return `${Number(d)} ${MONTHS[mi]}`;
}

const LONDON_HM = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'Europe/London', hour: '2-digit', minute: '2-digit', hour12: false,
});

/** An instant as HH:MM in Europe/London. */
export function londonHM(iso: string | number | Date | null | undefined): string {
  if (iso == null) return DASH;
  const d = iso instanceof Date ? iso : new Date(iso);
  if (Number.isNaN(d.getTime())) return DASH;
  return LONDON_HM.format(d);
}

/** Journeys tracking-gap banner: shown only when starts fall short of joins. */
export function showTrackingGap(joined: number | null, starts: number | null): boolean {
  return joined != null && joined > 0 && (starts ?? 0) < 0.8 * joined;
}

export function trackingGapCopy(joined: number, starts: number): string {
  const who = joined === 1 ? 'member' : 'members';
  const rec = starts === 1 ? 'start was' : 'starts were';
  return `${joined} ${who} joined in 30 days but only ${starts} sign-up ${rec} recorded, so the old sign-up funnel read ${starts}, 0, 0. Joined now comes from accounts, not events.`;
}

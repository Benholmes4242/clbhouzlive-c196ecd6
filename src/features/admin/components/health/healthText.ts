/** Shared Health wording: ages, plurals and durations (BRIEF_HEALTH). */
import { DASH } from '../analytics/analyticsFormat';

/** '1 round' / '2 rounds'. Singular only at exactly 1. */
export function plural(n: number, one: string, many = `${one}s`): string {
  return `${n.toLocaleString('en-GB')} ${n === 1 ? one : many}`;
}

/** Age from seconds: under 1h '{m}m', under 48h '{h}h', else '{d}d'; '{n}mo' over 60 days when months. */
export function ageSecs(secs: number | null | undefined, months = false): string {
  if (secs == null || !Number.isFinite(secs)) return DASH;
  const s = Math.max(0, secs);
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  if (s < 48 * 3600) return `${Math.floor(s / 3600)}h`;
  const d = Math.floor(s / 86400);
  if (months && d > 60) return `${Math.floor(d / 30)}mo`;
  return `${d}d`;
}

export function ageOf(iso: string | null | undefined, now = Date.now(), months = false): string {
  if (!iso) return DASH;
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return DASH;
  return ageSecs((now - t) / 1000, months);
}

/** Time until an instant, same wording. */
export function untilOf(iso: string | null | undefined, now = Date.now()): string {
  if (!iso) return DASH;
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return DASH;
  return ageSecs((t - now) / 1000);
}

/** '3h 12m', or '{m}m' under 1h. Input hours. */
export function hoursMins(hrs: number | null | undefined): string {
  if (hrs == null) return DASH;
  const total = Math.max(0, Math.round(hrs * 60));
  if (total < 60) return `${total}m`;
  return `${Math.floor(total / 60)}h ${total % 60}m`;
}

/** Minutes -> 'Xh Ym' or 'Xm'. */
export const minsText = (m: number | null | undefined) => (m == null ? DASH : hoursMins(m / 60));

/** Seconds -> 'Xs', or '{m}m' from 60s. */
export function secsText(s: number | null | undefined): string {
  if (s == null) return DASH;
  const v = Math.max(0, Math.round(s));
  return v < 60 ? `${v}s` : `${Math.floor(v / 60)}m`;
}

const WORDS = ['Zero', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
/** 'Two'...'Nine', digits from 10. */
export const countWord = (n: number) => (n < 10 ? WORDS[n] : String(n));

export function joinAnd(xs: string[]): string {
  if (xs.length <= 1) return xs[0] ?? '';
  return `${xs.slice(0, -1).join(', ')} and ${xs[xs.length - 1]}`;
}

const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const LONDON_DM = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/London', day: 'numeric', month: 'numeric' });

/** An INSTANT as '{d Mon}' in Europe/London. Calendar dates use dateLabel instead. */
export function londonDayMon(iso: string | null | undefined): string {
  if (!iso) return DASH;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return DASH;
  const parts = LONDON_DM.formatToParts(d);
  const day = parts.find((p) => p.type === 'day')?.value;
  const month = Number(parts.find((p) => p.type === 'month')?.value) - 1;
  return `${day} ${MON[month]}`;
}

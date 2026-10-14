/**
 * pg_cron schedule -> English, plus previous/next run (BRIEF_HEALTH).
 * pg_cron runs in UTC: every schedule is PARSED in UTC and SHOWN in
 * Europe/London, so a 07:00 UTC job reads 08:00 in summer and 07:00 in winter.
 * ONE wording, used by every Health surface.
 */
import { CronExpressionParser } from 'cron-parser';

export type CronShape = 'hours' | 'hourly' | 'minute' | 'minutes' | 'daily' | 'weekly' | 'monthly' | 'raw';

export interface CronWording {
  shape: CronShape;
  /** e.g. 'every 6 hours', 'daily at 03:00', 'monthly, 1st at 08:00'. Raw schedule when shape is 'raw'. */
  text: string;
  /** True when text is the raw schedule and must render in monospace. */
  mono: boolean;
  /** Phrase used after 'scheduled' in the verdict: 'for the 1st of each month', 'every Mon', 'daily'. */
  phrase: string;
}

const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const INT = /^\d+$/;

const LONDON_PARTS = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'Europe/London', year: 'numeric', month: 'numeric', day: 'numeric',
  hour: '2-digit', minute: '2-digit', weekday: 'short', hour12: false,
});

function londonParts(d: Date) {
  const p: Record<string, string> = {};
  for (const x of LONDON_PARTS.formatToParts(d)) p[x.type] = x.value;
  const hour = p.hour === '24' ? '00' : p.hour;
  return { day: Number(p.day), month: Number(p.month) - 1, hm: `${hour}:${p.minute}`, weekday: p.weekday };
}

export function ordinal(n: number): string {
  const m100 = n % 100;
  if (m100 >= 11 && m100 <= 13) return `${n}th`;
  const m = n % 10;
  return `${n}${m === 1 ? 'st' : m === 2 ? 'nd' : m === 3 ? 'rd' : 'th'}`;
}

/** UTC h:m on the calendar day of `ref`, shown as London HH:MM. */
function londonHMForUtc(h: number, m: number, ref: Date): string {
  const d = new Date(Date.UTC(ref.getUTCFullYear(), ref.getUTCMonth(), ref.getUTCDate(), h, m));
  return londonParts(d).hm;
}

function joinAnd(xs: string[]): string {
  if (xs.length <= 1) return xs[0] ?? '';
  return `${xs.slice(0, -1).join(', ')} and ${xs[xs.length - 1]}`;
}

export function nextRun(schedule: string, now: Date = new Date()): Date | null {
  try { return CronExpressionParser.parse(schedule, { tz: 'UTC', currentDate: now }).next().toDate(); }
  catch { return null; }
}

export function prevRun(schedule: string, now: Date = new Date()): Date | null {
  try { return CronExpressionParser.parse(schedule, { tz: 'UTC', currentDate: now }).prev().toDate(); }
  catch { return null; }
}

/** '1 Nov 03:00' in London. */
export function dayMonHM(d: Date | null | undefined): string {
  if (!d) return '-';
  const p = londonParts(d);
  return `${p.day} ${MONTHS[p.month]} ${p.hm}`;
}

export function describeSchedule(schedule: string, now: Date = new Date()): CronWording {
  const raw: CronWording = { shape: 'raw', text: schedule, mono: true, phrase: schedule };
  const f = schedule.trim().split(/\s+/);
  if (f.length !== 5) return raw;
  const [mi, h, dom, mon, dow] = f;
  if (mon !== '*') return raw;

  if (dom === '*' && dow === '*') {
    if ((mi === '*' || mi === '*/1') && h === '*') {
      return { shape: 'minute', text: 'every minute', mono: false, phrase: 'every minute' };
    }
    const mm = /^(?:\*|\d+-\d+)\/(\d+)$/.exec(mi);
    if (mm && h === '*') {
      const t = `every ${Number(mm[1])} minutes`;
      return { shape: 'minutes', text: t, mono: false, phrase: t };
    }
    if (INT.test(mi)) {
      const hh = /^\*\/(\d+)$/.exec(h);
      if (hh) {
        const t = `every ${Number(hh[1])} hours`;
        return { shape: 'hours', text: t, mono: false, phrase: t };
      }
      if (h === '*') {
        const t = `hourly at :${mi.padStart(2, '0')}`;
        return { shape: 'hourly', text: t, mono: false, phrase: t };
      }
      const hours = h.split(',');
      if (hours.every((x) => INT.test(x))) {
        const times = hours.map((x) => londonHMForUtc(Number(x), Number(mi), now)).sort();
        return { shape: 'daily', text: `daily at ${joinAnd(times)}`, mono: false, phrase: 'daily' };
      }
    }
    return raw;
  }

  if (!INT.test(mi) || !INT.test(h)) return raw;
  const next = nextRun(schedule, now);
  if (!next) return raw;
  const p = londonParts(next);

  if (dom === '*' && INT.test(dow)) {
    return { shape: 'weekly', text: `weekly, ${p.weekday} at ${p.hm}`, mono: false, phrase: `every ${p.weekday}` };
  }
  if (INT.test(dom) && dow === '*') {
    const o = ordinal(p.day);
    return { shape: 'monthly', text: `monthly, ${o} at ${p.hm}`, mono: false, phrase: `for the ${o} of each month` };
  }
  return raw;
}

export { DOW as CRON_DOW };

/**
 * getCurrentWeek — returns the current PGA-style tournament week.
 *
 * Convention: Sunday → Saturday (PGA Tour convention; tournament cycles
 * bookend naturally — Sunday final round to Saturday third round).
 *
 * Returns:
 *   start  — Sunday 00:00:00 of the week containing `now`
 *   end    — Saturday 23:59:59 of the same week
 *   label  — "APR 28 – MAY 4" caps style for the THIS WEEK anchor band
 */
export interface CurrentWeek {
  start: Date;
  end: Date;
  label: string;
}

const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

export function getCurrentWeek(now: Date = new Date()): CurrentWeek {
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  // Sunday = 0; subtract today's day-of-week to land on Sunday.
  start.setDate(start.getDate() - start.getDay());

  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  end.setHours(23, 59, 59, 999);

  const sm = MONTHS[start.getMonth()];
  const sd = start.getDate();
  const em = MONTHS[end.getMonth()];
  const ed = end.getDate();

  const label = sm === em ? `${sm} ${sd} – ${ed}` : `${sm} ${sd} – ${em} ${ed}`;

  return { start, end, label };
}

/** Returns yyyy-MM key for the current month — for matching MonthDivider IDs. */
export function getCurrentMonthKey(now: Date = new Date()): string {
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

/** True if the given ISO date string falls inside the current Sun→Sat week. */
export function isInCurrentWeek(dateStr: string, now: Date = new Date()): boolean {
  const { start, end } = getCurrentWeek(now);
  const d = new Date(dateStr + (dateStr.length === 10 ? 'T12:00:00Z' : ''));
  const t = d.getTime();
  return t >= start.getTime() && t <= end.getTime();
}

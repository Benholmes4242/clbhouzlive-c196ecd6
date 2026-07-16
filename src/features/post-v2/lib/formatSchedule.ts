// Shared friendly formatter for scheduled post times.
// "Today - 21:15" / "Tomorrow - 09:00" / "Fri 17 Jul - 18:30"
//
// Wave 3a: "Today"/"Tomorrow" now route through i18n via the `composer` ns.
import { formatWeekdayShort, formatMonthShort } from '@/i18n/format';
import i18n from '@/i18n';

function sameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

/** Day label only: "Today" | "Tomorrow" | "Fri 17 Jul". */
export function formatScheduleDay(target: Date, now: Date = new Date()): string {
  if (sameDay(target, now)) return i18n.t('composer:schedule.today');
  const tmr = new Date(now); tmr.setDate(tmr.getDate() + 1);
  if (sameDay(target, tmr)) return i18n.t('composer:schedule.tomorrow');
  return `${formatWeekdayShort(target)} ${target.getDate()} ${formatMonthShort(target)}`;
}

/** HH:MM 24h. */
export function formatScheduleTime(target: Date): string {
  return `${String(target.getHours()).padStart(2, '0')}:${String(target.getMinutes()).padStart(2, '0')}`;
}

/** "Today - 21:15", "Tomorrow - 09:00", "Fri 17 Jul - 18:30". */
export function formatSchedule(target: Date, now: Date = new Date()): string {
  return `${formatScheduleDay(target, now)} - ${formatScheduleTime(target)}`;
}

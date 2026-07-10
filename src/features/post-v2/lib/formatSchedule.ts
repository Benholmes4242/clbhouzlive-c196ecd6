// Shared friendly formatter for scheduled post times.
// "Today - 21:15" / "Tomorrow - 09:00" / "Fri 17 Jul - 18:30"

const DAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function sameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

/** Day label only: "Today" | "Tomorrow" | "Fri 17 Jul". */
export function formatScheduleDay(target: Date, now: Date = new Date()): string {
  if (sameDay(target, now)) return 'Today';
  const tmr = new Date(now); tmr.setDate(tmr.getDate() + 1);
  if (sameDay(target, tmr)) return 'Tomorrow';
  return `${DAY_SHORT[target.getDay()]} ${target.getDate()} ${MONTH_SHORT[target.getMonth()]}`;
}

/** HH:MM 24h. */
export function formatScheduleTime(target: Date): string {
  return `${String(target.getHours()).padStart(2, '0')}:${String(target.getMinutes()).padStart(2, '0')}`;
}

/** "Today - 21:15", "Tomorrow - 09:00", "Fri 17 Jul - 18:30". */
export function formatSchedule(target: Date, now: Date = new Date()): string {
  return `${formatScheduleDay(target, now)} - ${formatScheduleTime(target)}`;
}

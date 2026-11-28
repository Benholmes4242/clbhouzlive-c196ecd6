/** Brief 50 Part F — pure selection for played-rating-reminders, so the rules
 * are unit-tested without a database. One reminder per member per 7 days; the
 * newest tick at least 2 days old, never reminded, still unrated; muted
 * members get nothing. */
export const REMINDER_TYPE = 'rate_played_course';
const DAY = 86_400_000;

export interface TickRow { user_id: string; course_id: string; created_at: string; reminded_at: string | null }
export interface Pick { user_id: string; course_id: string; ticked_at: string }

export function selectReminders(input: {
  ticks: TickRow[];
  rated: Set<string>;            // `${user_id}:${course_id}`
  lastReminderAt: Map<string, string>; // user_id -> created_at of last rate_played_course
  muted: Set<string>;            // user_ids muting rate_played_course
  now: Date;
}): Pick[] {
  const now = input.now.getTime();
  const best = new Map<string, TickRow>();
  for (const t of input.ticks) {
    if (t.reminded_at) continue;
    if (now - new Date(t.created_at).getTime() < 2 * DAY) continue;
    if (input.rated.has(`${t.user_id}:${t.course_id}`)) continue;
    if (input.muted.has(t.user_id)) continue;
    const last = input.lastReminderAt.get(t.user_id);
    if (last && now - new Date(last).getTime() < 7 * DAY) continue;
    const cur = best.get(t.user_id);
    if (!cur || t.created_at > cur.created_at) best.set(t.user_id, t);
  }
  return [...best.values()].map(t => ({ user_id: t.user_id, course_id: t.course_id, ticked_at: t.created_at }));
}

export const shortName = (name: string) => name.replace(/\s*\([^)]*\)\s*$/, '').trim() || name;

export function reminderCopy(courseName: string, tickedAt: string, now: Date) {
  const recent = now.getTime() - new Date(tickedAt).getTime() <= 7 * DAY;
  return {
    title: `${shortName(courseName)}, how was it?`,
    body: recent
      ? "You ticked it off this week. Rate it in a minute and it counts towards the golfers' order."
      : "You ticked it off on clbhouz. Rate it in a minute and it counts towards the golfers' order.",
  };
}

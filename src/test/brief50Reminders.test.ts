import { describe, expect, it } from 'vitest';
import { reminderCopy, selectReminders, type TickRow } from '../../supabase/functions/played-rating-reminders/selection';

const now = new Date('2026-11-28T03:00:00Z');
const t = (user_id: string, course_id: string, created_at: string, reminded_at: string | null = null): TickRow => ({ user_id, course_id, created_at, reminded_at });
const base = { rated: new Set<string>(), lastReminderAt: new Map<string, string>(), muted: new Set<string>(), now };

describe('14 played-rating-reminders selection', () => {
  it('newest eligible tick ≥ 2 days old, one per member', () => {
    const picks = selectReminders({ ...base, ticks: [t('u', 'a', '2026-11-20T00:00:00Z'), t('u', 'b', '2026-11-25T00:00:00Z'), t('u', 'c', '2026-11-27T12:00:00Z')] });
    expect(picks).toEqual([{ user_id: 'u', course_id: 'b', ticked_at: '2026-11-25T00:00:00Z' }]);
  });
  it('skips rated, reminded, muted and members reminded within 7 days', () => {
    const ticks = [t('r', 'a', '2026-11-20T00:00:00Z'), t('d', 'a', '2026-11-20T00:00:00Z', '2026-11-22T00:00:00Z'), t('m', 'a', '2026-11-20T00:00:00Z'), t('w', 'a', '2026-11-20T00:00:00Z'), t('ok', 'a', '2026-11-20T00:00:00Z')];
    const picks = selectReminders({ ticks, rated: new Set(['r:a']), muted: new Set(['m']), lastReminderAt: new Map([['w', '2026-11-24T00:00:00Z'], ['ok', '2026-11-19T00:00:00Z']]), now });
    expect(picks.map(p => p.user_id)).toEqual(['ok']);
  });
  it('copy and this-week wording', () => {
    expect(reminderCopy('Royal Portrush (Dunluce)', '2026-11-25T00:00:00Z', now)).toEqual({ title: 'Royal Portrush, how was it?', body: "You ticked it off this week. Rate it in a minute and it counts towards the golfers' order." });
    expect(reminderCopy('Muirfield', '2026-10-01T00:00:00Z', now).body).toBe("You ticked it off on clbhouz. Rate it in a minute and it counts towards the golfers' order.");
  });
});

import { describe, it, expect } from 'vitest';
import { orderOpenItems, summariseQueues, membersAffected, totalMembers, isLongWait } from '@/features/admin/lib/inboxQueue';
import { flowColumns, formatWaitHours } from '@/features/admin/hooks/useInboxFlow';
import type { InboxItem } from '@/features/admin/hooks/useInboxFeed';

const NOW = Date.parse('2026-10-12T12:00:00Z');
const daysAgo = (d: number) => new Date(NOW - d * 86_400_000).toISOString();

const item = (id: string, type: InboxItem['type'], age: number, extra: Partial<InboxItem> = {}, payload: unknown = {}): InboxItem => ({
  id, type, title: id, meta: '', createdAt: daysAgo(age), isHighPriority: false, payload, ...extra,
});

describe('BRIEF_INBOX_WORK_THE_QUEUE ordering', () => {
  it('an unmatched course counts its members, a high-priority report 2, anything else 1', () => {
    expect(membersAffected(item('u', 'unmatchedCourse', 1, {}, { member_count: 5 }))).toBe(5);
    expect(membersAffected(item('r', 'report', 1, { isHighPriority: true }))).toBe(2);
    expect(membersAffected(item('s', 'support', 1))).toBe(1);
  });

  it('orders members affected first, then longest wait', () => {
    const out = orderOpenItems([
      item('support-new', 'support', 1),
      item('support-old', 'support', 93),
      item('unmatched', 'unmatchedCourse', 2, {}, { member_count: 3 }),
      item('report-high', 'report', 0, { isHighPriority: true }),
    ]);
    expect(out.map(i => i.id)).toEqual(['unmatched', 'report-high', 'support-old', 'support-new']);
  });

  it('summarises only non-empty queues, members desc then oldest', () => {
    const qs = summariseQueues([
      item('a', 'support', 5), item('b', 'support', 20),
      item('c', 'courseRequest', 93),
      item('d', 'unmatchedCourse', 1, {}, { member_count: 4 }),
    ]);
    expect(qs.map(q => q.type)).toEqual(['unmatchedCourse', 'support', 'courseRequest']);
    expect(qs[1]).toMatchObject({ count: 2, members: 2, oldestIso: daysAgo(20) });
  });

  it('members waiting on us sums the same rule', () => {
    expect(totalMembers([item('u', 'unmatchedCourse', 1, {}, { member_count: 7 }), item('s', 'support', 1)])).toBe(8);
  });

  it('a wait of 14 days or more is long, 13 is not', () => {
    expect(isLongWait(daysAgo(14), NOW)).toBe(true);
    expect(isLongWait(daysAgo(13.9), NOW)).toBe(false);
  });
});

describe('Flow panel', () => {
  it('fills exactly 14 columns ending today from a sparse daily list', () => {
    const cols = flowColumns({
      window_days: 14, came_in: 6, cleared: 0, median_wait_hours: null, computed_at: '',
      daily: [
        { date: '2026-09-29', came_in: 0, cleared: 0 },
        { date: '2026-10-09', came_in: 5, cleared: 0 },
      ],
    }, 14, new Date(NOW));
    expect(cols).toHaveLength(14);
    expect(cols[0].date).toBe('2026-09-29');
    expect(cols[13].date).toBe('2026-10-12');
    expect(cols.find(c => c.date === '2026-10-09')?.came_in).toBe(5);
  });

  it('median wait renders hours, days past 48h, and an em dash for null', () => {
    expect(formatWaitHours(null)).toBe('\u2014');
    expect(formatWaitHours(12.4)).toBe('12h');
    expect(formatWaitHours(72)).toBe('3d');
  });
});

describe('Done view LONGEST WAIT', () => {
  it('is the maximum closed-minus-opened among items cleared in the last 7 days', async () => {
    const { longestWaitHours } = await import('@/features/admin/lib/inboxQueue');
    const done = [
      { ...item('a', 'support', 1), openedAt: daysAgo(4) },        // 3d wait, cleared 1d ago
      { ...item('b', 'courseRequest', 2), openedAt: daysAgo(95) }, // 93d wait, cleared 2d ago
      { ...item('c', 'report', 10), openedAt: daysAgo(200) },      // cleared 10d ago: excluded
    ];
    expect(longestWaitHours(done, NOW)).toBe(93 * 24);
    expect(longestWaitHours([], NOW)).toBeNull();
  });
});

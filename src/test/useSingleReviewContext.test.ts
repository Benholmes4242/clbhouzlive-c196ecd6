import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fetchSingleReviewContext } from '@/hooks/useSingleReviewContext';
const fixture = vi.hoisted(() => ({ connected: true, synced: null as number | null, calls: [] as string[], ratingPages: [] as any[][] }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { from: (table: string) => {
  const query: any = {
    select: () => query, eq: () => query, not: () => query, order: () => query,
    maybeSingle: async () => ({ data: { eg_app_connected: fixture.connected, eg_handicap_index: fixture.synced, manual_handicap_index: 12, gender: 'male' }, error: null }),
    range: async (from: number, to: number) => { fixture.calls.push(`${from}-${to}`); return { data: fixture.ratingPages.shift() ?? [], error: null }; },
    then: (resolve: any) => Promise.resolve({ data: null, error: null, count: table === 'gam_round_stats' ? 2 : null }).then(resolve),
  };
  return query;
} } }));
beforeEach(() => { fixture.connected = true; fixture.synced = null; fixture.calls = []; fixture.ratingPages = []; });
describe('REVIEWS_STATE_2 context', () => {
  it('connected rater with no synced index remains unknown, never manual 12', async () => {
    expect((await fetchSingleReviewContext('member', 'course')).handicap).toBeNull();
  });
  it('unconnected rater uses the canonical manual resolver result', async () => {
    fixture.connected = false;
    expect((await fetchSingleReviewContext('member', 'course')).handicap).toBe(12);
  });
  it('history continues beyond 500 rows and counts distinct courses and perfect tens', async () => {
    fixture.ratingPages = [Array.from({ length: 500 }, (_, n) => ({ course_id: `c${n}`, rating: 8 })), [{ course_id: 'last', rating: 10 }]];
    const result = await fetchSingleReviewContext('member', 'course');
    expect(fixture.calls).toEqual(['0-499', '500-999']);
    expect(result.coursesRated).toBe(501);
    expect(result.perfectTens).toBe(1);
    expect(result.roundsHere).toBe(2);
  });
});
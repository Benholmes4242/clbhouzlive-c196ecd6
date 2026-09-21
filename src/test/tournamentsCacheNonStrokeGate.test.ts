/**
 * BRIEF_NON_STROKE_GATE_2 §2 — exercises the LIVE bucket directly.
 *
 * The rendered overview cannot prove this path today: the cache's live bucket
 * only populates when an event flips to `inprogress`, which for the Presidents
 * Cup happens on Thursday. So the fabricated dataset below contains an
 * inprogress cup row, and the assertion is that the bucket-splitting fetch
 * never returns it — because a cup's score column holds match points (higher
 * wins), so any leader taken from it is the losing side.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

interface Row {
  id: string;
  name: string;
  status: string;
  event_type: string;
  start_date: string;
  end_date: string;
}

const ROWS: Row[] = [
  { id: 'cup-live', name: 'Presidents Cup', status: 'inprogress', event_type: 'cup', start_date: '2026-09-24', end_date: '2026-09-27' },
  { id: 'stroke-live', name: 'Procore Championship', status: 'inprogress', event_type: 'stroke', start_date: '2026-09-24', end_date: '2026-09-27' },
  { id: 'match-live', name: 'T-Mobile Match Play', status: 'inprogress', event_type: 'match', start_date: '2026-09-24', end_date: '2026-09-27' },
  { id: 'cup-closed', name: 'Ryder Cup', status: 'closed', event_type: 'cup', start_date: '2026-09-10', end_date: '2026-09-13' },
  { id: 'stroke-closed', name: 'Tour Championship', status: 'closed', event_type: 'stroke', start_date: '2026-09-10', end_date: '2026-09-13' },
  { id: 'cup-scheduled', name: 'Solheim Cup', status: 'scheduled', event_type: 'cup', start_date: '2099-01-01', end_date: '2099-01-04' },
  { id: 'stroke-scheduled', name: 'Sanderson Farms', status: 'scheduled', event_type: 'stroke', start_date: '2099-01-01', end_date: '2099-01-04' },
];

function makeQuery() {
  const filters: Array<(r: Row) => boolean> = [];
  const chain: any = {
    select: () => chain,
    eq: (col: string, val: unknown) => { filters.push((r) => (r as any)[col] === val); return chain; },
    in: (col: string, vals: unknown[]) => { filters.push((r) => vals.includes((r as any)[col])); return chain; },
    gte: (col: string, val: string) => { filters.push((r) => String((r as any)[col]) >= val); return chain; },
    gt: (col: string, val: string) => { filters.push((r) => String((r as any)[col]) > val); return chain; },
    limit: () => chain,
    order: () => chain,
    then: (resolve: (v: unknown) => unknown) =>
      Promise.resolve({ data: ROWS.filter((r) => filters.every((f) => f(r))), error: null }).then(resolve),
  };
  return chain;
}

vi.mock('@/integrations/supabase/client', () => ({
  supabase: { from: () => makeQuery() },
}));

import { fetchTournamentsCache } from '@/hooks/useTournamentsCache';

describe('useTournamentsCache — non-stroke gate', () => {
  beforeEach(() => vi.clearAllMocks());

  it('excludes an inprogress cup from the LIVE bucket', async () => {
    const cache = await fetchTournamentsCache();
    const ids = cache.live.map((t) => t.id);
    expect(ids).toContain('stroke-live');
    expect(ids).not.toContain('cup-live');
    expect(ids).not.toContain('match-live');
  });

  it('excludes cups from the completed and upcoming buckets', async () => {
    const cache = await fetchTournamentsCache();
    expect(cache.completed.map((t) => t.id)).toEqual(['stroke-closed']);
    expect(cache.upcoming.map((t) => t.id)).toEqual(['stroke-scheduled']);
  });

  it('every event_type present in the fixture is non-stroke except the stroke rows', async () => {
    const cache = await fetchTournamentsCache();
    const all = [...cache.live, ...cache.completed, ...cache.upcoming] as unknown as Row[];
    expect(all.length).toBeGreaterThan(0);
    expect(all.every((t) => t.event_type === 'stroke')).toBe(true);
  });
});

import { describe, it, expect, vi, beforeEach } from 'vitest';

let rankRows: Array<Record<string, unknown>> = [];
let statRows: Array<{ player_id: string; fedex_points: number | null; updated_at: string | null }> = [];
const calls: Array<{ table: string; eq: Array<[string, unknown]> }> = [];

vi.mock('@/integrations/supabase/client', () => {
  const builder = (table: string) => {
    const rec = { table, eq: [] as Array<[string, unknown]> };
    calls.push(rec);
    const b: Record<string, unknown> = {};
    const chain = () => b;
    Object.assign(b, {
      select: chain, order: chain, ilike: chain, in: chain, gte: chain, lte: chain,
      eq: (k: string, v: unknown) => { rec.eq.push([k, v]); return b; },
      limit: () => Promise.resolve({ data: table === 'sr_player_statistics' ? statRows : table === 'tour_season_rankings' ? rankRows : [{ position: 1, points: 9, player_key: 'X', player_id: 'x', snapshot_date: '2026-12-01' }], error: null }),
    });
    return b;
  };
  return { supabase: { from: (t: string) => builder(t) } };
});

import { freshPgaStandings, freshStandings } from '@/features/tourhub/components/overview-v3/useSeasonRecap';

beforeEach(() => { calls.length = 0; });

describe('PGA recap standings from sr_player_statistics', () => {
  it('reads the season, orders by fedex points, drops zero and null, ranks by position', async () => {
    statRows = [
      { player_id: 'b', fedex_points: 2000, updated_at: '2026-08-25T10:00:00Z' },
      { player_id: 'z', fedex_points: 0, updated_at: '2026-08-25T10:00:00Z' },
      { player_id: 'a', fedex_points: 3000, updated_at: '2026-08-26T10:00:00Z' },
      { player_id: 'n', fedex_points: null, updated_at: null },
    ];
    const out = await freshPgaStandings('season-1', '2026-08-24');
    expect(calls[0].table).toBe('sr_player_statistics');
    expect(calls[0].eq).toContainEqual(['season_id', 'season-1']);
    expect(out?.rows.map((r) => [r.position, r.playerId])).toEqual([[1, 'a'], [2, 'b']]);
    expect(out?.source).toEqual({ table: 'sr_player_statistics', date: '2026-08-26T10:00:00Z' });
  });

  it('is not fresh when the newest updated_at is before the final event ended', async () => {
    statRows = [{ player_id: 'a', fedex_points: 3000, updated_at: '2026-08-20T10:00:00Z' }];
    expect(await freshPgaStandings('season-1', '2026-08-24')).toBeNull();
  });

  it('reads nothing without a season id', async () => {
    expect(await freshPgaStandings(null, '2026-08-24')).toBeNull();
    expect(calls).toHaveLength(0);
  });
});

describe('ruling 2: snapshots are not a recap source', () => {
  it('a snapshot dated after the final event does not make a stale list fresh', async () => {
    rankRows = [{ position: 1, points: 2221, player_name: 'Ross Steelman', player_id: 'p', manual_player_id: null, scraped_at: '2026-09-07T06:00:00Z' }];
    expect(await freshStandings('pgad', 2026, '2026-10-11')).toBeNull();
    expect(calls.map((c) => c.table)).not.toContain('tour_standings_snapshots');
  });
  it('a scraped_at on or after the final event is fresh', async () => {
    rankRows = [{ position: 1, points: 2221, player_name: 'Ross Steelman', player_id: 'p', manual_player_id: null, scraped_at: '2026-11-09T09:12:09Z' }];
    expect((await freshStandings('pgad', 2026, '2026-10-11'))?.source).toEqual({ table: 'tour_season_rankings', date: '2026-11-09T09:12:09Z' });
  });
});

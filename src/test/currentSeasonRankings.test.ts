import { beforeEach, describe, expect, it, vi } from 'vitest';

const state = vi.hoisted(() => ({ year: 2027 as number | null, rankings: [] as any[], events: [] as any[], calls: [] as any[] }));
vi.mock('@/features/tourhub/_shared/currentSeason', () => ({ currentSeasonFor: async () => ({ id: 'season', year: state.year }) }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { from: (table: string) => {
  const filters: Record<string, any> = {};
  let head = false;
  let cap = Infinity;
  const b: any = {
    select: (_: string, opts?: any) => { head = !!opts?.head; return b; },
    eq: (k: string, v: any) => { filters[k] = v; return b; },
    in: (k: string, v: any) => { filters[k] = v; return b; },
    or: (v: string) => { filters.followed = v; return b; },
    order: () => b,
    limit: (v: number) => { cap = v; return b; },
    then: (resolve: any) => {
      state.calls.push({ table, filters: { ...filters } });
      let data = table === 'sr_seasons' ? [{ id: 'season', year: filters.year, tour_name: filters.tour_name }] : table === 'sr_tournaments' ? state.events : table === 'tour_season_rankings' ? state.rankings : [];
      data = data.filter((row: any) => Object.entries(filters).every(([k, v]) => k === 'followed' ? v.includes(`"${row.player_id}"`) : Array.isArray(v) ? v.includes(row[k]) : row[k] === v));
      return resolve({ data: data.slice(0, cap), count: head ? data.length : null, error: null });
    },
  };
  return b;
} } }));

import { countEventsLeft, fetchSeasonBoard } from '@/features/tourhub/overview/data/useRankingsBoards';
import { fetchFollowedSeason } from '@/features/tourhub/overview/data/useFollowedBoardRows';

const rank = (year: number, playerId: string | null = null) => ({ tour_code: 'euro', season_year: year, position: 1, player_name: `Year ${year}`, player_id: playerId, points: 10 });
beforeEach(() => { state.year = 2027; state.rankings = []; state.events = []; state.calls = []; });
describe('date-resolved season rankings', () => {
  it('uses current-season rows and that season events-left', async () => {
    state.rankings = [rank(2027), rank(2026)];
    state.events = [{ season_id: 'season', event_type: 'stroke', status: 'scheduled' }];
    const board = await fetchSeasonBoard('euro');
    expect(board.rows[0].playerName).toBe('Year 2027');
    expect(board.eventsLeft).toBe(1);
    expect(state.calls.find((c) => c.table === 'sr_seasons').filters.year).toBe(2027);
  });
  it('uses previous-year rows without any events-left clause when current list is empty', async () => {
    state.rankings = [rank(2026)];
    const board = await fetchSeasonBoard('euro');
    expect(board.rows[0].playerName).toBe('Year 2026');
    expect(board.eventsLeft).toBeNull();
    expect(state.calls.some((c) => c.table === 'sr_tournaments')).toBe(false);
  });
  it('counts only scheduled/created stroke/team events', async () => {
    state.events = ['stroke', 'team', 'cup', 'match'].map((event_type) => ({ season_id: 'season', status: 'scheduled', event_type }));
    state.events.push({ season_id: 'season', status: 'closed', event_type: 'stroke' });
    expect(await countEventsLeft('euro')).toBe(2);
  });
  it('followed rows use the same previous-year fallback', async () => {
    state.rankings = [rank(2026, 'followed')];
    expect((await fetchFollowedSeason('euro', ['followed']))[0].playerName).toBe('Year 2026');
  });
  it('an absent followed player cannot trigger previous-year fallback if the current list exists', async () => {
    state.rankings = [rank(2027, 'other'), rank(2026, 'followed')];
    expect(await fetchFollowedSeason('euro', ['followed'])).toEqual([]);
  });
  it('a null season year falls back to the calendar year', async () => {
    state.year = null;
    state.rankings = [rank(new Date().getFullYear())];
    expect((await fetchSeasonBoard('euro')).rows[0].playerName).toBe(`Year ${new Date().getFullYear()}`);
  });
});
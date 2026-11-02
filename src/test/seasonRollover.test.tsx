import { describe, expect, it, vi, beforeEach } from 'vitest';
import { cleanup, render, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

vi.mock('react-i18next', () => ({ initReactI18next: { type: '3rdParty', init: () => {} }, useTranslation: () => ({ t: (_k: string, o?: { defaultValue?: string }) => o?.defaultValue ?? '', i18n: { language: 'en' } }) }));

// sr_seasons / sr_player_statistics / tour_season_rankings rows the season resolver reads.
const h = vi.hoisted(() => ({
  seasons: [] as Array<{ id: string; year: number }>,
  stats: [] as Array<{ season_id: string; fedex_points: number }>,
  rankings: [] as Array<{ tour_code: string; season_year: number; points: number }>,
  rpc: vi.fn(async () => ({ data: [], error: null })),
}));

vi.mock('@/integrations/supabase/client', () => {
  const from = (table: string) => {
    const f: Array<(r: Record<string, unknown>) => boolean> = [];
    let ord: { k: string; asc: boolean } | null = null;
    let lim = Infinity;
    const c: Record<string, unknown> = {};
    c.select = () => c;
    c.eq = (k: string, v: unknown) => { f.push((r) => r[k] === v || k === 'tour_name'); return c; };
    c.gt = (k: string, v: number) => { f.push((r) => Number(r[k]) > v); return c; };
    c.order = (k: string, o?: { ascending?: boolean }) => { ord = { k, asc: o?.ascending !== false }; return c; };
    c.limit = (n: number) => { lim = n; return c; };
    c.then = (res: (v: unknown) => void) => {
      const src = table === 'sr_seasons' ? h.seasons : table === 'sr_player_statistics' ? h.stats : table === 'tour_season_rankings' ? h.rankings : [];
      let rows = (src as Array<Record<string, unknown>>).filter((r) => f.every((fn) => fn(r)));
      if (ord) { const { k, asc } = ord; rows = [...rows].sort((a, b) => (asc ? 1 : -1) * (Number(a[k]) - Number(b[k]))); }
      res({ data: rows.slice(0, lim), error: null });
    };
    return c;
  };
  return { supabase: { from, rpc: h.rpc } };
});

const STAKE = { after_position: 100, explainer: 'Full card for 2027.', featured: true, foot: null, kicker: 'THE 100 LINE', line_label: 'The 100 line', pill_label: 'The 100 line', side: null, sort: 1, picks: true, picks_title: 'WHO KEEPS THEIR CARD?', settled_at: '2026-11-23T06:00:00Z' };
const RACE_2026 = { title: 'FedEx Cup', status: 'live', phase_label: 'FEDEXCUP FALL', phase_start: '2026-09-14', closes_on: '2026-10-31', season_year: 2026, tour_code: 'pga', updated_at: '', picks_close_at: '2026-11-19T12:00:00Z' };

const seen = vi.hoisted(() => ({ rankingSeason: [] as unknown[], raceSeason: [] as unknown[] }));
vi.mock('@/features/tourhub/players-v2/data/useTourRace', () => ({
  useTourRace: (_t: string, season: number | null | undefined) => {
    seen.raceSeason.push(season);
    if (season === undefined) return { data: undefined };
    return { data: season === 2026 ? { race: RACE_2026, seasonYear: 2026, stakes: [STAKE], events: [{ id: 'e', name: 'RSM Classic', startDate: '2026-11-19', endDate: '2026-11-22', finished: true }] } : { race: null, seasonYear: season, stakes: [], events: [] } };
  },
}));
vi.mock('@/features/tourhub/players-v2/data/usePlayersRanking', () => ({
  usePlayersRanking: (_t: string, season: number | null | undefined) => {
    seen.rankingSeason.push(season);
    const rows = Array.from({ length: 120 }, (_, i) => ({
      playerId: `p${i + 1}`, rank: i + 1, name: `${season === 2027 ? 'New' : 'Old'} Player${i + 1}`, country: null, countryCode: null, photoUrl: null, tourCode: 'pga',
      stat: 5000 - i * 10, wins: 0, top10s: 0, eventsPlayed: 20, playerKey: `p${i + 1}`, rawName: `Player ${i + 1}`, updatedAt: null, pga: null,
    }));
    return { data: season === undefined ? undefined : { synced: true, statLabel: 'PTS', rows }, isLoading: false, isError: false, refetch: vi.fn() };
  },
}));
vi.mock('@/features/tourhub/players-v2/data/useLivePlayerIds', () => ({ useLivePlayerIds: () => ({ data: {} }) }));
vi.mock('@/features/tourhub/players-v2/data/useWorldRankLookup', () => ({ useWorldRankLookup: () => ({ data: {} }) }));
vi.mock('@/features/tourhub/leaderboard/useTourPlayerFollows', () => ({ useTourPlayerFollows: () => ({ ids: new Set(), busy: false, error: null, toggle: vi.fn() }) }));
vi.mock('@/features/tourhub/hooks/useTourLensFromPicker', () => ({ useTourLensFromPicker: () => {} }));
vi.mock('@/features/tourhub/hooks/useTourSelection', () => ({ readStoredTour: () => null }));
vi.mock('@/features/guest/useGuestActionGate', () => ({ useGuestActionGate: () => () => false }));
vi.mock('@/utils/analyticsEvents', () => ({ analyticsEvents: { track: vi.fn() } }));

import { effectiveStatus } from '@/features/tourhub/players-v2/playersRules';
import { resolveStandingsSeason } from '@/features/tourhub/players-v2/data/resolveStandingsSeason';
import { PlayersTab } from '@/features/tourhub/players-v2/PlayersTab';

beforeEach(() => {
  cleanup();
  seen.rankingSeason = [];
  seen.raceSeason = [];
  h.seasons = [{ id: 's26', year: 2026 }, { id: 's27', year: 2027 }];
  h.stats = [{ season_id: 's26', fedex_points: 4986 }];
  h.rankings = [];
});

describe('effectiveStatus', () => {
  const race = { status: 'live', closes_on: '2026-11-22' };
  it('live on and before closes_on', () => {
    expect(effectiveStatus(race, '2026-11-21')).toBe('live');
    expect(effectiveStatus(race, '2026-11-22')).toBe('live');
  });
  it('final the day after closes_on', () => expect(effectiveStatus(race, '2026-11-23')).toBe('final'));
  it("final when status is 'final'", () => expect(effectiveStatus({ status: 'final', closes_on: null }, '2026-01-01')).toBe('final'));
});

describe('resolveStandingsSeason', () => {
  it('PGA: 2027 only once a 2027 row has points', async () => {
    h.stats = [{ season_id: 's26', fedex_points: 4986 }, { season_id: 's27', fedex_points: 0 }];
    expect(await resolveStandingsSeason('pga')).toBe(2026);
    h.stats.push({ season_id: 's27', fedex_points: 500 });
    expect(await resolveStandingsSeason('pga')).toBe(2027);
  });
  it('other tours: zero-point 2027 rows are ignored', async () => {
    h.rankings = [{ tour_code: 'euro', season_year: 2026, points: 3000 }, { tour_code: 'euro', season_year: 2027, points: 0 }];
    expect(await resolveStandingsSeason('euro')).toBe(2026);
    h.rankings.push({ tour_code: 'euro', season_year: 2027, points: 120 });
    expect(await resolveStandingsSeason('euro')).toBe(2027);
  });
});

function mount() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={qc}><MemoryRouter initialEntries={['/tourhub?tab=players']}><PlayersTab /></MemoryRouter></QueryClientProvider>);
}

describe('rollover', () => {
  it('2027 standings with points: 2027 standings, no line cards, no clock, no picks card', async () => {
    h.stats.push({ season_id: 's27', fedex_points: 500 });
    const { container } = mount();
    await waitFor(() => expect(container.querySelector('[data-front-card="race"]')).not.toBeNull());
    expect(seen.rankingSeason.at(-1)).toBe(2027);
    expect(seen.raceSeason.at(-1)).toBe(2027);
    expect(container.querySelector('[data-front-card="race"]')!.textContent).toContain('New Player1');
    expect(container.querySelector('[data-front-card="line"]')).toBeNull();
    expect(container.querySelector('[data-race-clock]')).toBeNull();
    expect(container.querySelector('[data-front-card="picks"]')).toBeNull();
  });

  it('2027 standings all zero: 2026 shown as final with the settled picks card', async () => {
    h.stats.push({ season_id: 's27', fedex_points: 0 });
    const { container } = mount();
    await waitFor(() => expect(container.querySelector('[data-front-card="picks"]')).not.toBeNull());
    expect(seen.rankingSeason.at(-1)).toBe(2026);
    expect(container.querySelector('[data-front-card="race"]')!.textContent).toContain('Old Player1');
    expect(container.querySelector('[data-front-card="line"]')).not.toBeNull();
    expect(container.querySelector('[data-race-clock]')).toBeNull();
    expect(container.querySelector('[data-picks-state]')!.getAttribute('data-picks-state')).toBe('settled');
    expect(container.querySelector('[data-situation]')!.textContent).toBe('The season is over. Full card for 2027.');
    expect(container.textContent).toContain('finished on top');
  });
});

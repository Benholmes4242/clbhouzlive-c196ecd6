import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, renderHook, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createInstance } from 'i18next';
import { I18nextProvider, initReactI18next } from 'react-i18next';
import en from '@/locales/en/tourhub.json';
import type { BoardEntry } from '@/features/tourhub/leaderboard/BoardTable';

/** Fake sr_leaderboards: evaluates the probe filters on fixture rows and counts probes. */
const f = vi.hoisted(() => ({ rows: [] as Array<Record<string, unknown>>, probes: [] as string[], live: [] as unknown[], meta: null as unknown, playerRow: null as unknown }));
vi.mock('@/integrations/supabase/client', () => {
  const split = (s: string) => { const out: string[] = []; let depth = 0, cur = ''; for (const ch of s) { if (ch === '(') depth++; if (ch === ')') depth--; if (ch === ',' && depth === 0) { out.push(cur); cur = ''; } else cur += ch; } out.push(cur); return out; };
  const term = (row: Record<string, unknown>, t: string) => {
    if (t === 'status.is.null') return row.status == null;
    const m = t.match(/^status\.not\.in\.\((.*)\)$/); if (m) return row.status != null && !m[1].split(',').includes(String(row.status));
    const r = t.match(/^(round_\d)\.not\.is\.null$/); if (r) return row[r[1]] != null;
    throw new Error(`unknown term ${t}`);
  };
  const from = (table: string) => {
    const state = { tid: null as unknown, ors: [] as string[], player: null as unknown };
    const b: Record<string, unknown> = {
      select: () => b,
      eq: (col: string, v: unknown) => { if (col === 'tournament_id') state.tid = v; if (col === 'player_id') state.player = v; return b; },
      or: (s: string) => { state.ors.push(s); return b; },
      limit: () => {
        if (state.player) return b;
        f.probes.push(`${table}:${state.ors.join('&')}`);
        const data = f.rows.filter(row => row.tournament_id === state.tid && state.ors.every(o => split(o).some(t => term(row, t)))).slice(0, 1).map(row => ({ id: row.id }));
        return Promise.resolve({ data, error: null });
      },
      maybeSingle: () => Promise.resolve({ data: f.playerRow, error: null }),
      order: () => Promise.resolve({ data: [], error: null }),
    };
    return b;
  };
  return { supabase: { from } };
});
vi.mock('@/features/tourhub/hooks/useLiveTournaments', () => ({ useLiveTournaments: () => ({ data: f.live, isFetched: true, isLoading: false, isSuccess: true, status: 'success', fetchStatus: 'idle' }) }));
vi.mock('@/features/tourhub/hooks/useTourPickerRows', () => ({ useTourPickerRows: () => ({ ready: true, rows: [{ key: 'pga', slug: 'pga', tournamentId: 'rsm', status: 'live', eventName: 'The RSM Classic', startDate: '2026-11-19', currentRound: 4, acceptable: true, selected: true, disabled: false }] }) }));
vi.mock('@/features/tourhub/context/TourSelectionContext', async (orig) => ({ ...(await orig<Record<string, unknown>>()), useTourSelection: () => ({ selectedTourSlug: 'pga', viewingTourSlug: 'pga', appliedTourSlug: 'pga' }) }));
vi.mock('@/features/tourhub/hooks/useActiveMensMajor', () => ({ useActiveMensMajor: () => null }));
vi.mock('@/features/tourhub/leaderboard/useTournamentMeta', () => ({ useTournamentMeta: () => ({ data: f.meta }) }));
vi.mock('@/features/tourhub/hooks/usePlayerResults', () => ({ usePlayerResults: () => ({ data: [] }) }));
vi.mock('@/features/tourhub/hooks/useLeaderboardRealtime', () => ({ useLeaderboardRealtime: () => {} }));
vi.mock('@/features/tourhub/leaderboard/useTourPlayerFollows', () => ({ useTourPlayerFollows: () => ({ ids: new Set<string>() }) }));
vi.mock('@/features/tourhub/leaderboard/ScorecardSheet', () => ({ ScorecardSheet: () => null }));

import { effectiveCurrentRound } from '@/features/tourhub/components/overview-v3/liveStateRules';
import { effectiveRoundKey, useEffectiveRound } from '@/features/tourhub/hooks/useEffectiveRound';
import { useTourIslandDescriptor } from '@/features/tourhub/components/TourIsland';
import { TourSideMenu } from '@/features/tourhub/components/TourSideMenu';
import { usePlayerState } from '@/features/tourhub/hooks/usePlayerState';
import { LinkedLiveCard } from '@/features/pro-profile/LinkedProSections';
import { useOverviewNewsData } from '@/features/tourhub/overview/sections/useOverviewNewsData';
import { CutWatchLine } from '@/features/tourhub/overview/sections/OnTheCourse';
import { statusFor } from '@/features/tourhub/overview/sections/AlsoThisWeek';
import type { HeroSlide } from '@/features/tourhub/hooks/useHeroCarouselData';
import type { TourStory } from '@/features/tourhub/news/useTourStories';

const language = createInstance();
await language.use(initReactI18next).init({ lng: 'en', fallbackLng: 'en', resources: { en: { tourhub: en } }, defaultNS: 'tourhub', interpolation: { escapeValue: false }, initAsync: false });
const row = (cards: Array<number | null>, extra: Partial<BoardEntry> = {}): BoardEntry => ({ id: 'x', position: null, score: null, thru: null, round_1: cards[0] ?? null, round_2: cards[1] ?? null, round_3: cards[2] ?? null, round_4: cards[3] ?? null, ...extra });
const seed = (rows: BoardEntry[], tid = 'rsm') => { f.rows = rows.map((r, i) => ({ ...r, id: `${tid}-${i}`, tournament_id: tid })); };
const rsm = [row([-4, -5]), row([-6, -3]), row([-4, -4])];
const rsmR3 = [row([-4, -5, -1]), row([-6, -3, 0]), row([-4, -4, 1])];
let client: QueryClient;
const wrapper = ({ children }: { children: React.ReactNode }) => <QueryClientProvider client={client}><MemoryRouter><I18nextProvider i18n={language}>{children}</I18nextProvider></MemoryRouter></QueryClientProvider>;
const fresh = () => { client = new QueryClient({ defaultOptions: { queries: { retry: false } } }); };
fresh();
afterEach(() => { cleanup(); f.rows = []; f.probes = []; f.live = []; f.meta = null; f.playerRow = null; fresh(); });

const CASES: Array<[string, number | null, BoardEntry[]]> = [
  ['RSM: provider 4, highest scored 2', 4, rsm],
  ['normal between rounds', 4, [row([-1, -2, -3]), row([0, 0, 1])]],
  ['mid-round', 3, [row([-1, -2, -1]), row([0, 0, null])]],
  ['before round 1', 1, [row([]), row([])]],
  ['cancelled round 3, round 4 values', 4, [row([-1, -2, null, -3]), row([0, 0, null, null])]],
  ['provider lags', 2, [row([-1, -2, -3])]],
  ['empty board keeps the provider round', 4, []],
  ['inactive rows do not count', 4, [row([-1, -2, -3], { status: 'MC' }), row([-1, -2], { status: null })]],
];

describe('useEffectiveRound matches effectiveCurrentRound', () => {
  for (const [name, provider, rows] of CASES) {
    it(name, async () => {
      seed(rows);
      const { result } = renderHook(() => useEffectiveRound('rsm', provider), { wrapper });
      const expected = effectiveCurrentRound(provider, rows);
      await waitFor(() => expect(result.current).toBe(expected));
    });
  }
  it('returns the provider round while loading, before any probe settles', () => {
    seed(rsm);
    const { result } = renderHook(() => useEffectiveRound('rsm', 4), { wrapper });
    expect(result.current).toBe(4);
  });
  it('never probes an event that is not live', async () => {
    seed(rsm);
    const { result } = renderHook(() => useEffectiveRound('rsm', 4, false), { wrapper });
    expect(result.current).toBe(4);
    expect(f.probes).toHaveLength(0);
  });
});

describe('probe budget and sharing', () => {
  it('RSM shape costs two probes', async () => {
    seed(rsm);
    const { result } = renderHook(() => useEffectiveRound('rsm', 4), { wrapper });
    await waitFor(() => expect(result.current).toBe(3));
    expect(f.probes).toHaveLength(2);
  });
  it('the normal case costs one probe', async () => {
    seed(rsmR3);
    const { result } = renderHook(() => useEffectiveRound('rsm', 4), { wrapper });
    await waitFor(() => expect(result.current).toBe(4));
    expect(f.probes).toHaveLength(1);
  });
  it('two consumers share one query key and one set of probes', async () => {
    seed(rsm);
    const { result } = renderHook(() => [useEffectiveRound('rsm', 4), useEffectiveRound('rsm', 4)], { wrapper });
    await waitFor(() => expect(result.current).toEqual([3, 3]));
    expect(f.probes).toHaveLength(2);
    expect(client.getQueryCache().findAll({ queryKey: ['tourhub', 'effective-round'] }).map(q => q.queryKey)).toEqual([effectiveRoundKey('rsm', 4)]);
  });
});

const liveLite = { id: 'rsm', name: 'The RSM Classic', status: 'inprogress', currentRound: 4, leaderName: 'Ben Griffin', leaderCount: 1, leaderToPar: -9 };
for (const [label, rows, want] of [['RSM', rsm, 3], ['round 3 scored', rsmR3, 4]] as const) {
  describe(`surfaces, ${label}: round ${want}`, () => {
    it('Tour island caption', async () => {
      seed([...rows]); f.live = [liveLite];
      const { result } = renderHook(() => useTourIslandDescriptor('overview'), { wrapper });
      await waitFor(() => expect(result.current.caption).toBe(`Live · Round ${want}`));
    });
    it('Tour side menu live row', async () => {
      seed([...rows]); f.live = [liveLite];
      render(<TourSideMenu open onClose={() => {}} activeTab="overview" onSelectTab={() => {}} onSettings={() => {}} onProfile={() => {}} onSignOut={() => {}} />, { wrapper });
      await waitFor(() => expect(screen.getByText(language.t('tour.menu.roundN', { n: want, ns: 'tourhub' }))).toBeTruthy());
    });
    it('player page live strip round', async () => {
      seed([...rows]); f.playerRow = { tournament_id: 'rsm', position: 1, position_tied: false, score: -9, thru: 18, status: null, tournament: { name: 'The RSM Classic', status: 'inprogress', current_round: 4 } };
      const { result } = renderHook(() => usePlayerState('p1'), { wrapper });
      await waitFor(() => expect(result.current.liveData?.currentRound).toBe(want));
    });
    it('pro profile This week card', async () => {
      seed([...rows]);
      const data = { tournament_id: 'rsm', position: 1, position_tied: false, score: -9, thru: 18, today: 0, holes: [], tournament: { name: 'The RSM Classic', status: 'inprogress', current_round: 4, venue_course_name: 'Seaside', venue_name: null } };
      const { container } = render(<LinkedLiveCard data={data as never} playerId="p1" name="Ben" tour="pga" />, { wrapper });
      await waitFor(() => expect(container.querySelector('.pro-profile-venue')?.textContent).toBe(`Seaside · Round ${want}`));
    });
    it('overview news live-story round', async () => {
      seed([...rows]);
      client.setQueryData(['tournaments-cache'], { live: [{ id: 'rsm', status: 'inprogress', start_date: '2026-11-19', end_date: '2026-11-22', current_round: 4 }], upcoming: [], completed: [] });
      const story = { id: 's1', slug: 's', kicker: null, headline: 'h', standfirst: null, body_blocks: [], image_url: null, image_credit: null, tour_slug: 'pga', tournament_id: 'rsm', published_at: null } as TourStory;
      const { result } = renderHook(() => useOverviewNewsData([story]), { wrapper });
      await waitFor(() => expect(result.current.get('s1')?.liveRound).toBe(want));
    });
    it('cut line keys to the effective round (cut round 3)', async () => {
      seed([...rows]); f.meta = { status: 'inprogress', current_round: 4, cut_round: 3, cutline: null, projected_cutline: -2 };
      const { container } = render(<CutWatchLine tournamentId="rsm" />, { wrapper });
      if (want === 3) await waitFor(() => expect(container.textContent).not.toBe(''));
      else { await waitFor(() => expect(f.probes).toHaveLength(1)); await waitFor(() => expect(container.textContent).toBe('')); }
    });
    it('Also this week statusFor', () => {
      const slide = { type: 'live', tournament: { currentRound: 4 } } as unknown as HeroSlide;
      expect(statusFor(slide, new Date(), want)).toBe(`Live · Round ${want}`);
    });
  });
}

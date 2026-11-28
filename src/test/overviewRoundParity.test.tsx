import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, render, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createInstance } from 'i18next';
import { I18nextProvider, initReactI18next } from 'react-i18next';
import en from '@/locales/en/tourhub.json';
import type { BoardEntry } from '@/features/tourhub/leaderboard/BoardTable';
import type { HeroSlide } from '@/features/tourhub/hooks/useHeroCarouselData';
import type { HeroState } from '@/features/tourhub/components/overview-v3/HybridHero.utils';
import type { AITopContender } from '@/features/tourhub/hooks/useAIPredictions';
import type { TeeGroup } from '@/features/tourhub/tournament-v2/data/useTeeTimesAll';

const f = vi.hoisted(() => ({ rows: [] as BoardEntry[], reads: vi.fn() }));
vi.mock('@/features/tourhub/hooks/useBatchCourseImages', () => ({ useBatchCourseImages: () => ({ data: new Map() }) }));
vi.mock('@/features/tourhub/components/overview-v3/useOverviewChampion', () => ({ useOverviewChampion: () => ({ rows: f.rows, needsInitials: false, champion: null, showChampion: false }) }));
vi.mock('@/features/tourhub/components/overview-v3/useUpcomingOverview', () => ({ useUpcomingOverview: () => ({ last: [], field: [], first: null, zone: null }) }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { from: (table: string) => {
  const builder = { select: () => builder, eq: () => builder, order: () => { f.reads(table); return Promise.resolve({ data: [], error: null }); } };
  return builder;
}, rpc: () => Promise.resolve({ data: null, error: null }) } }));

import { HybridHero } from '@/features/tourhub/components/overview-v3/HybridHero';
import { PhotoBand } from '@/features/tourhub/components/overview-v3/HybridHeroBands/PhotoBand';
import { LivePicksBlock } from '@/features/tourhub/components/overview-v3/HybridHeroBands/LivePicksBlock';
import { useLiveOverview } from '@/features/tourhub/components/overview-v3/LiveOverviewSections';
import { overviewRoundState } from '@/features/tourhub/components/overview-v3/liveStateRules';
import { useOverviewRoundState } from '@/features/tourhub/components/overview-v3/useOverviewRoundState';

const language = createInstance();
await language.use(initReactI18next).init({ lng: 'en', resources: { en: { tourhub: en } }, defaultNS: 'tourhub', interpolation: { escapeValue: false }, initAsync: false });
const now = new Date('2026-11-21T21:47:00Z');
const past = '2026-11-21T14:10:00Z';
const future = '2026-11-21T22:00:00Z';
const player = { id: 'a', full_name: 'Player A' };
const inPlay: BoardEntry = { id: 'a', player, position: 1, score: -10, round_1: -4, round_2: -5, round_3: -1, today: -1, today_round: 3, thru: 7 };
const beforeR3: BoardEntry = { ...inPlay, score: -9, round_3: null, today: -5, today_round: 2, thru: 18 };
const fixtures = [
  { name: 'in play R3', kind: 'live', round: 3, rows: [inPlay], status: 'inprogress', tee: past, hero: 'PGA TOUR · ROUND 3 · LIVE', picks: 'OUR TOURNAMENT PICKS · ROUND 3' },
  { name: 'after R3', kind: 'live', round: 3, rows: [{ ...inPlay, thru: 18 }], status: 'closed', tee: future, hero: 'PGA TOUR · ROUND 3 COMPLETE', picks: 'OUR TOURNAMENT PICKS' },
  { name: 'R3 delayed', kind: 'live', round: 3, rows: [beforeR3], status: 'scheduled', tee: past, hero: 'PGA TOUR · ROUND 3 · DELAYED', picks: 'OUR TOURNAMENT PICKS · DELAYED' },
  { name: 'R3 suspended', kind: 'suspended', round: 3, rows: [inPlay], status: 'suspended', tee: past, hero: 'PGA TOUR · ROUND 3 · SUSPENDED', picks: 'OUR TOURNAMENT PICKS · SUSPENDED' },
  { name: 'before the first tee', kind: 'live', round: 1, rows: [{ id: 'a', player, position: 1, score: 0, thru: 0 }], status: 'scheduled', tee: future, hero: 'PGA TOUR · ROUND 1 · STARTS 22:00', picks: 'OUR TOURNAMENT PICKS' },
  { name: 'final round', kind: 'live', round: 4, rows: [{ ...inPlay, round_4: -1, today_round: 4 }], status: 'inprogress', tee: past, hero: 'PGA TOUR · FINAL ROUND · LIVE', picks: 'OUR TOURNAMENT PICKS · FINAL ROUND' },
] as const;
type Fixture = Omit<(typeof fixtures)[number], 'status'> & { status: string };
function stateOf(fixture: Fixture): HeroState { return fixture.kind === 'suspended' ? { kind: 'suspended', round: fixture.round, totalRounds: 4, reason: null } : { kind: 'live', round: fixture.round, totalRounds: 4 }; }
const picks = [{ playerId: 'a', playerName: 'Player A' }] as AITopContender[];
function groups(tee: string): TeeGroup[] { return [{ teeTime: tee, startingHole: 1, players: [{ id: 'a', name: 'Player A' }] }]; }
function clientFor(fixture: Fixture, seedTees = true) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, staleTime: Infinity } } });
  client.setQueryData(['tourhub', 'tournament-meta', 'v2', 'rsm'], { status: 'inprogress', current_round_status: fixture.status, cut_round: 2, course_timezone: 'UTC' });
  client.setQueryData(['tournament-v3', 'course-holes', 'rsm'], []);
  for (let round = 1; round <= 4; round++) {
    client.setQueryData(['tournament-v2', 'hole-analysis', 'rsm', round], { available: false });
    if (seedTees) client.setQueryData(['tournament-v2', 'tee-times-all', 'rsm', round], groups(fixture.tee));
  }
  client.setQueryData(['tourhub', 'our-pick-record', 'pga', 2026], null);
  return client;
}
function wrapper(client: QueryClient) { return function Providers({ children }: { children: React.ReactNode }) { return <MemoryRouter><QueryClientProvider client={client}><I18nextProvider i18n={language}>{children}</I18nextProvider></QueryClientProvider></MemoryRouter>; }; }
function Harness({ fixture }: { fixture: Fixture }) {
  const state = stateOf(fixture);
  const tournament = { id: 'rsm', name: 'The RSM Classic', status: 'inprogress', currentRoundStatus: fixture.status, startDate: '2026-11-19', endDate: '2026-11-22', tourName: 'PGA Tour', tourSlug: 'pga' };
  const live = useLiveOverview('rsm', { kind: fixture.kind, round: fixture.round, totalRounds: 4, entries: f.rows, currentRoundStatus: fixture.status, status: tournament.status }, now);
  const result = live.stage;
  const line = f.rows[0];
  return <><HybridHero slide={{ type: 'live', tournament } as HeroSlide} state={state} now={now} activeTournamentId="rsm" onSelectTour={() => {}} onOpenTournament={() => {}} />
    {result && <LivePicksBlock picks={picks} tourCode="pga" seasonYear={2026} stage={result.stage} round={result.round} roundState={result}
      boardByPlayer={new Map([['a', { position: line?.position ?? null, tied: false, score: line?.score ?? null, thru: line?.thru, started: true }]])}
      teeByPlayer={new Map(live.firstTees.flatMap(g => g.players.filter(p => p.id === 'a').map(p => [p.id ?? '', g.teeTime] as [string, string])))}
      zone="UTC" intro={null} onOpenPick={() => {}} onOpenRecord={() => {}} />}</>;
}
afterEach(() => { cleanup(); f.rows = []; f.reads.mockClear(); });

describe('overview hero and picks share one round state', () => {
  it.each(fixtures)('$name names the same round and state', fixture => {
    f.rows = [...fixture.rows];
    const view = render(<Harness fixture={fixture} />, { wrapper: wrapper(clientFor(fixture)) });
    expect(view.container.querySelector('[data-overview-photo-kicker-row]')?.textContent).toBe(fixture.hero);
    expect(view.container.querySelector('[data-live-picks] [data-hero-head-eyebrow]')?.textContent).toBe(fixture.picks);
    if (fixture.round === 1) expect(view.container.querySelector('[data-overview-glass-card]')).not.toBeNull();
    const eyebrow = view.container.querySelector('[data-live-picks] [data-hero-head-eyebrow]')?.textContent ?? '';
    expect(eyebrow).toBe(eyebrow.toLocaleUpperCase());
  });
  it('kicker is the title column first child immediately before h1', () => {
    const view = render(<PhotoBand title="RSM" venueName={null} datesString={null} venueImageUrl={null} state={{ kind: 'live', round: 3, totalRounds: 4 }} tourLabel="PGA Tour" leader={null} countdown={[]} startDay={null} />, { wrapper: wrapper(clientFor(fixtures[0])) });
    const kicker = view.container.querySelector('[data-overview-photo-kicker-row]');
    expect(kicker?.parentElement?.firstElementChild).toBe(kicker);
    expect(kicker?.nextElementSibling?.tagName).toBe('H1');
  });
  it('delayed pick keeps current position/score and published delayed-round tee', () => {
    const fixture = fixtures[2]; f.rows = [...fixture.rows];
    const view = render(<Harness fixture={fixture} />, { wrapper: wrapper(clientFor(fixture)) });
    expect(view.container.querySelector('[data-live-pick-sub]')?.textContent).toBe('1 · −9');
    expect(view.container.querySelector('[data-live-pick-right]')?.textContent).toBe('14:10');
    expect(view.container.querySelector('[data-live-pick-right]')?.getAttribute('data-live-pick-right')).toBe('tee');
    expect(view.container.querySelector('[data-live-picks] [data-hero-head-eyebrow]')?.textContent).toBe('OUR TOURNAMENT PICKS · DELAYED');
  });
  it('delay with no pick tee keeps position/score without an invented tee', () => {
    const fixture = fixtures[2]; f.rows = [...fixture.rows];
    const client = clientFor(fixture); client.setQueryData(['tournament-v2', 'tee-times-all', 'rsm', 3], [{ teeTime: past, startingHole: 1, players: [{ id: 'b', name: 'Other player' }] }]);
    const view = render(<Harness fixture={fixture} />, { wrapper: wrapper(client) });
    expect(view.container.querySelector('[data-live-pick-sub]')?.textContent).toBe('1 · −9');
    expect(view.container.querySelector('[data-live-pick-right]')).toBeNull();
  });
  it.each(['starter', 'status', 'future tees'] as const)('delay automatically ends on %s without remounting', async trigger => {
    const delayed = fixtures[2]; f.rows = [...delayed.rows];
    const client = clientFor(delayed);
    const view = render(<Harness fixture={delayed} />, { wrapper: wrapper(client) });
    expect(view.container.querySelector('[data-live-picks] [data-hero-head-eyebrow]')?.textContent).toContain('DELAYED');
    if (trigger === 'starter') { f.rows = [inPlay]; view.rerender(<Harness fixture={delayed} />); }
    if (trigger === 'status') view.rerender(<Harness fixture={{ ...delayed, status: 'inprogress' } as Fixture} />);
    if (trigger === 'future tees') await act(async () => { client.setQueryData(['tournament-v2', 'tee-times-all', 'rsm', 3], groups(future)); });
    await waitFor(() => expect(view.container.querySelector('[data-live-picks] [data-hero-head-eyebrow]')?.textContent).not.toContain('DELAYED'));
    expect(view.container.querySelector('[data-overview-photo-kicker-row]')?.textContent).not.toContain('DELAYED');
  });
});

describe('round status precedence and unchanged delay boundary', () => {
  const input = { kind: 'live' as const, round: 3, totalRounds: 4, entries: [beforeR3], status: 'inprogress', firstTee: past, now };
  it('tournament round status wins over scheduled meta', () => expect(overviewRoundState({ ...input, currentRoundStatus: 'inprogress', metaCurrentRoundStatus: 'scheduled' }).delayedRound).toBeNull());
  it('scheduled tournament status wins over in-progress meta', () => expect(overviewRoundState({ ...input, currentRoundStatus: 'scheduled', metaCurrentRoundStatus: 'inprogress' }).delayedRound).toBe(3));
  it('null tournament status falls back to meta', () => expect(overviewRoundState({ ...input, currentRoundStatus: null, metaCurrentRoundStatus: 'inprogress' }).delayedRound).toBeNull());
  it('only more than sixty minutes delays the current round', () => {
    expect(overviewRoundState({ ...input, currentRoundStatus: 'scheduled', now: new Date('2026-11-21T15:10:00Z') }).delayedRound).toBeNull();
    expect(overviewRoundState({ ...input, currentRoundStatus: 'scheduled', now: new Date('2026-11-21T15:10:00.001Z') }).delayedRound).toBe(3);
  });
});

describe('shared tee observers preserve the hero query', () => {
  it.each([fixtures[1], fixtures[2], fixtures[4]])('$name has one enabled tee key and one read for photo plus live sections', async fixture => {
    f.rows = [...fixture.rows];
    const client = clientFor(fixture, false);
    function Pair() {
      useOverviewRoundState({ id: 'rsm', status: 'inprogress', currentRoundStatus: fixture.status }, stateOf(fixture), f.rows, now);
      useLiveOverview('rsm', { kind: fixture.kind, round: fixture.round, totalRounds: 4, entries: f.rows, currentRoundStatus: fixture.status, status: 'inprogress' }, now);
      return null;
    }
    render(<Pair />, { wrapper: wrapper(client) });
    await waitFor(() => expect(f.reads).toHaveBeenCalledTimes(1));
    const tees = client.getQueryCache().findAll({ queryKey: ['tournament-v2', 'tee-times-all'] });
    expect(tees.map(q => q.queryKey)).toEqual([['tournament-v2', 'tee-times-all', 'rsm', fixture.name === 'after R3' ? 4 : fixture.round]]);
    expect(f.reads).toHaveBeenCalledWith('sr_tee_times');
  });
});
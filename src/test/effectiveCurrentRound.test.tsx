import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createInstance } from 'i18next';
import { I18nextProvider, initReactI18next } from 'react-i18next';
import en from '@/locales/en/tourhub.json';
import type { BoardEntry } from '@/features/tourhub/leaderboard/BoardTable';
import type { HeroSlide } from '@/features/tourhub/hooks/useHeroCarouselData';
import type { TeeGroup } from '@/features/tourhub/tournament-v2/data/useTeeTimesAll';
import type { SlotTournament } from '@/features/clubhouse-tour/tourSlotRules';

const f = vi.hoisted(() => ({ rows: [] as BoardEntry[], groups: [] as TeeGroup[], read: vi.fn() }));
vi.mock('@/features/tourhub/hooks/useBatchCourseImages', () => ({ useBatchCourseImages: () => ({ data: new Map() }) }));
vi.mock('@/features/tourhub/components/overview-v3/useOverviewChampion', () => ({ useOverviewChampion: () => ({ rows: f.rows, needsInitials: false, champion: null, showChampion: false }) }));
vi.mock('@/features/tourhub/tournament-v2/data/useTeeTimesAll', () => ({ useTeeTimesAll: (id: string, round: number, options: { enabled: boolean }) => { f.read(id, round, options); return { data: f.groups, isSuccess: true, isFetched: true, isLoading: false }; } }));
vi.mock('@/features/tourhub/tournament-v2/data/useDrawnRounds', () => ({ useDrawnRounds: () => ({ data: [1, 2, 3, 4], isLoading: false }) }));
vi.mock('@/features/tourhub/leaderboard/useTournamentMeta', () => ({ useTournamentMeta: () => ({ data: { course_timezone: 'America/New_York' } }) }));
vi.mock('@/features/tourhub/components/overview-v3/useUpcomingOverview', () => ({ useUpcomingOverview: () => ({ last: [], field: [], first: null, zone: null }) }));
vi.mock('@/features/tourhub/leaderboard/ScorecardSheet', () => ({ ScorecardSheet: () => null }));
vi.mock('@/features/tourhub/tournament-v2/sections/HeroRoundPanel', () => ({ HeroRoundPanel: () => null }));
vi.mock('@/features/tourhub/hooks/useTournamentLastYearTop4', () => ({ useTournamentLastYearTop4: () => ({ data: null }) }));

import { effectiveCurrentRound, overviewRoundState } from '@/features/tourhub/components/overview-v3/liveStateRules';
import { heroStateLineShort } from '@/features/tourhub/components/overview-v3/HybridHeroBands/heroStateLineShort';
import { HybridHero } from '@/features/tourhub/components/overview-v3/HybridHero';
import { LeadersGroup } from '@/features/tourhub/components/overview-v3/HybridHeroBands/LeadersGroup';
import { LivePicksBlock } from '@/features/tourhub/components/overview-v3/HybridHeroBands/LivePicksBlock';
import { AlsoWeekEvent } from '@/features/tourhub/overview/sections/AlsoWeekEvent';
import { TourSlotView } from '@/features/clubhouse-tour/TourSlot';
import { slotLead } from '@/features/clubhouse-tour/slotLeadRules';

const language = createInstance();
await language.use(initReactI18next).init({ lng: 'en', fallbackLng: 'en', resources: { en: { tourhub: en } }, defaultNS: 'tourhub', interpolation: { escapeValue: false }, initAsync: false });
const t = language.getFixedT('en', 'tourhub');
const now = new Date('2026-11-22T14:05:00Z');
const r3Tee = '2026-11-22T12:00:00Z';
const p = (id: string) => ({ id, full_name: `Player ${id.toUpperCase()}` });
/** Ben's RSM read: provider round 4, rounds 1 and 2 only, everyone thru 18 from round 2. */
const rsm: BoardEntry[] = [
  { id: 'a', player: p('a'), position: 1, score: -9, round_1: -4, round_2: -5, round_3: null, round_4: null, today: -5, today_round: 2, thru: 18 },
  { id: 'b', player: p('b'), position: 1, score: -9, round_1: -6, round_2: -3, round_3: null, round_4: null, today: -3, today_round: 2, thru: 18 },
  { id: 'c', player: p('c'), position: 3, score: -8, round_1: -4, round_2: -4, round_3: null, round_4: null, today: -4, today_round: 2, thru: 18 },
];
const row = (cards: Array<number | null>, extra: Partial<BoardEntry> = {}): BoardEntry => ({ id: "x", position: null, score: null, thru: null, round_1: cards[0] ?? null, round_2: cards[1] ?? null, round_3: cards[2] ?? null, round_4: cards[3] ?? null, ...extra });
const group: TeeGroup = { teeTime: r3Tee, startingHole: 1, players: [{ id: 'a', name: 'Player A' }, { id: 'b', name: 'Player B' }] };
const rsmInput = { kind: 'live' as const, round: 4, totalRounds: 4, entries: rsm, status: 'inprogress', currentRoundStatus: 'scheduled', now };
const rsmState = () => overviewRoundState({ ...rsmInput, firstTee: r3Tee });
const tournament = { id: 'rsm', name: 'The RSM Classic', status: 'inprogress', currentRound: 4, currentRoundStatus: 'scheduled', startDate: '2026-11-19', endDate: '2026-11-22', tourSlug: 'pga', tourName: 'PGA Tour', venueName: 'Sea Island', venuePar: 70 };
const mount = (node: React.ReactElement) => render(node, { wrapper: ({ children }) => <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}><MemoryRouter><I18nextProvider i18n={language}>{children}</I18nextProvider></MemoryRouter></QueryClientProvider> });
afterEach(() => { cleanup(); f.rows = []; f.groups = []; f.read.mockClear(); });

describe('effectiveCurrentRound', () => {
  it('RSM now: provider 4, highest scored 2 gives round 3', () => expect(effectiveCurrentRound(4, rsm)).toBe(3));
  it('normal between rounds: provider 4 with round 3 complete gives 4', () => expect(effectiveCurrentRound(4, [row([-1, -2, -3]), row([0, 0, 1])])).toBe(4));
  it('mid-round: provider 3 with some round 3 values gives 3', () => expect(effectiveCurrentRound(3, [row([-1, -2, -1]), row([0, 0, null])])).toBe(3));
  it('before round 1: provider null, 0 or 1 with no scores gives 1', () => {
    for (const provider of [null, 0, 1]) expect(effectiveCurrentRound(provider, [row([]), row([])])).toBe(1);
  });
  it('cancelled round: provider 4, round 3 empty for everyone, round 4 values present gives 4', () => expect(effectiveCurrentRound(4, [row([-1, -2, null, -3]), row([0, 0, null, null])])).toBe(4));
  it('an unloaded (empty) board keeps the provider round, so the hero never flashes round 1', () => expect(effectiveCurrentRound(4, [])).toBe(4));
  it('provider lags: provider 2 with round 3 values stays 2', () => expect(effectiveCurrentRound(2, [row([-1, -2, -3])])).toBe(2));
});

describe('RSM shape names round 3 and DELAYED everywhere', () => {
  it('shared state: round 3, not after a round, delayed round 3, round 3 tees', () => {
    const base = overviewRoundState(rsmInput);
    expect(base.teeRound).toBe(3);
    const state = rsmState();
    expect(state.currentRound).toBe(3);
    expect(state.afterRound).toBeNull();
    expect(state.delayedRound).toBe(3);
  });
  it('normal between rounds still reports after round 3', () => {
    const rows = rsm.map(e => ({ ...e, round_3: -1, today: -1, today_round: 3 }));
    const state = overviewRoundState({ ...rsmInput, entries: rows, firstTee: '2026-11-22T16:00:00Z' });
    expect(state.currentRound).toBe(4);
    expect(state.afterRound).toBe(3);
    expect(state.delayedRound).toBeNull();
  });
  it('hero kicker reads PGA Tour · ROUND 3 · DELAYED with round 3 tees', () => {
    f.rows = rsm; f.groups = [group];
    const view = mount(<HybridHero slide={{ type: 'live', tournament } as unknown as HeroSlide} state={{ kind: 'live', round: 4, totalRounds: 4 }} now={now} activeTournamentId="rsm" onSelectTour={() => {}} onOpenTournament={() => {}} />);
    expect(view.container.querySelector('[data-overview-photo-kicker-row]')?.textContent).toBe('PGA Tour · ROUND 3 · DELAYED');
    expect(f.read).toHaveBeenCalledWith('rsm', 3, { enabled: true });
  });
  it('normal between-rounds hero still reads AFTER ROUND 3', () => {
    f.rows = rsm.map(e => ({ ...e, round_3: -1, today: -1, today_round: 3 })); f.groups = [{ ...group, teeTime: '2026-11-22T16:00:00Z' }];
    const view = mount(<HybridHero slide={{ type: 'live', tournament } as unknown as HeroSlide} state={{ kind: 'live', round: 4, totalRounds: 4 }} now={now} activeTournamentId="rsm" onSelectTour={() => {}} onOpenTournament={() => {}} />);
    expect(view.container.querySelector('[data-overview-photo-kicker-row]')?.textContent).toBe('PGA Tour · AFTER ROUND 3');
  });
  it('picks heading reads ROUND 3 · DELAYED', () => {
    const state = rsmState();
    const view = mount(<LivePicksBlock picks={[{ playerId: 'a', playerName: 'Player A' }] as never} tourCode="pga" seasonYear={2026} stage={state.stage} round={state.round} roundState={state}
      boardByPlayer={new Map()} teeByPlayer={null} zone="UTC" intro={null} onOpenPick={() => {}} onOpenRecord={() => {}} />);
    expect(view.container.querySelector('[data-hero-head-eyebrow]')?.textContent).toBe('OUR TOURNAMENT PICKS · DELAYED');
  });
  it("leaders' group shows round 3 delayed from the shared state, never Round 2 · Finished", () => {
    f.groups = [group];
    const view = mount(<LeadersGroup tournamentId="rsm" entries={rsm} currentRound={3} totalRounds={4} phase="live" status="inprogress" currentRoundStatus="scheduled" zone="America/New_York" now={now} live roundState={rsmState()} />);
    expect(view.container.querySelector('[data-hero-head-title]')?.textContent).toBe('A and B, delayed');
    expect(view.container.querySelector('[data-hero-head-eyebrow]')?.textContent).toBe("THE LEADERS' GROUP · ROUND 3");
    expect(f.read).toHaveBeenCalledWith('rsm', 3, { enabled: true });
  });
  it('also this week reads ROUND 3 · DELAYED from the round 3 tee', () => {
    const slide = { type: 'live', tournament: { ...tournament, venueCourseName: null, winnerId: null, purse: null, currency: null, defendingChampion: null } } as unknown as HeroSlide;
    const view = mount(<div className="also-week"><AlsoWeekEvent slide={slide} entries={rsm} teesByRound={new Map([[3, r3Tee]])} followed={new Set()} now={now} /></div>);
    expect(view.container.querySelector('.also-state')?.textContent).toBe('ROUND 3 · DELAYED');
    expect(view.container.querySelector('.also-state')).toHaveAttribute('data-state', 'delayed');
  });
  const slotEvent = { id: 'rsm', name: 'The RSM Classic', status: 'inprogress', event_type: 'stroke', start_date: '2026-11-19', end_date: '2026-11-22', purse: null, winning_share: null, currency: null, venue_id: null, venue_name: 'Sea Island', venue_course_name: null, venue_city: null, venue_state: null, venue_country: null, venue_par: 70, venue_yardage: null, winner_id: null, defending_champion: null, champion_narrative: null, season_id: 's', current_round: 4, current_round_status: 'scheduled', season: { id: 's', tour_id: 'pga', tour_name: 'pga', year: 2026 }, locksAt: null } as unknown as SlotTournament;
  it('feed tour post kicker names round 3 and DELAYED, never FINAL ROUND', () => {
    const view = mount(<TourSlotView selection={{ tournament: slotEvent, tour: 'pga', state: 'live' }} board={rsm} roundState={rsmState()} image={null} onOpen={() => {}} />);
    const kicker = view.container.querySelector('[data-tour-slot-kicker]')?.textContent ?? '';
    expect(kicker).toContain('ROUND 3 · DELAYED');
    expect(kicker).not.toContain('FINAL ROUND');
  });
  it('feed tour lead names round 3 for the yet-to-start leader', () => {
    const lead = slotLead({ tournament: slotEvent, tour: 'pga', state: 'live' }, [rsm[0], rsm[2]], t as never, now);
    expect(lead?.detail).toBe(t('slot.yetToStart', { round: 3 }));
  });
});

describe('narrow hero kicker short forms', () => {
  it('uses AFTER R3, R3 · DELAYED, R3 and unchanged FINAL ROUND', () => {
    expect(heroStateLineShort(t as never, { kind: 'live', round: 4, totalRounds: 4, afterRound: 3 })).toBe('AFTER R3');
    expect(heroStateLineShort(t as never, { kind: 'live', round: 3, totalRounds: 4, delayedRound: 3 })).toBe('R3 · DELAYED');
    expect(heroStateLineShort(t as never, { kind: 'live', round: 3, totalRounds: 4 })).toBe('R3');
    expect(heroStateLineShort(t as never, { kind: 'live', round: 4, totalRounds: 4 })).toBe('FINAL ROUND');
  });
  it('the photo kicker carries the tour-prefixed short form for the narrow layout', () => {
    f.rows = rsm; f.groups = [group];
    const view = mount(<HybridHero slide={{ type: 'live', tournament } as unknown as HeroSlide} state={{ kind: 'live', round: 4, totalRounds: 4 }} now={now} activeTournamentId="rsm" onSelectTour={() => {}} onOpenTournament={() => {}} />);
    expect(view.container.querySelector('[data-kicker-short]')?.getAttribute('data-kicker-short')).toBe('PGA Tour · R3 · DELAYED');
  });
});

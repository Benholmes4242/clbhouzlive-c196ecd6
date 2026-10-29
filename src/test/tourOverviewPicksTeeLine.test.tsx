/* Picks tee line (option A). Mocks copied from tourOverviewPicksChipsFullBoard. */
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { BoardEntry } from '@/features/tourhub/leaderboard/BoardTable';
import type { HeroState } from '@/features/tourhub/components/overview-v3/HybridHero.utils';

const f = vi.hoisted(() => ({
  picks: [] as Array<{ playerId: string; playerName: string }>,
  rows: [] as unknown[],
  live: [] as Array<{ id: string }>,
  sheet: vi.fn(),
  tees: { data: undefined as Map<string, string> | undefined },
}));
vi.mock('@/features/tourhub/tournament-v2/data/usePickTeeTimes', () => ({ usePickTeeTimes: () => f.tees }));
vi.mock('react-i18next', () => ({ initReactI18next: { type: '3rdParty', init: () => {} }, useTranslation: () => ({ t: (_k: string, o?: { defaultValue?: string }) => o?.defaultValue ?? '' }) }));
vi.mock('@/features/tourhub/context/TourSelectionContext', () => ({ useTourSelection: () => ({ viewingTournamentId: null, viewingTourSlug: 'pga' }) }));
vi.mock('@/features/tourhub/hooks/useAIPredictions', () => ({ useAIPredictions: () => ({ data: f.picks.length ? { topContenders: f.picks, tournament: { name: 'Event' } } : null }) }));
vi.mock('@/features/tourhub/hooks/useTournamentTeeTimes', () => ({ useTournamentTeeTimes: () => ({ data: [] }) }));
vi.mock('@/features/tourhub/hooks/useTournamentLastYearTop4', () => ({ useTournamentLastYearTop4: () => ({ data: [] }) }));
vi.mock('@/features/tourhub/overview/data/useTournamentVenueRecord', () => ({ useTournamentVenueRecord: () => ({ data: null }) }));
vi.mock('@/features/tourhub/tournament-v2/data/useDrawnRounds', () => ({ useDrawnRounds: () => ({ data: [] }) }));
vi.mock('@/features/tourhub/tournament-v2/data/useTeeTimesAll', () => ({ useTeeTimesAll: () => ({ data: [] }) }));
vi.mock('@/features/tourhub/components/overview-v3/HybridHeroBands/PicksSheet', () => ({ PicksSheet: () => null }));
vi.mock('@/features/tourhub/leaderboard/ScorecardSheet', () => ({ ScorecardSheet: () => null }));
vi.mock('@/features/tourhub/hooks/useTourHubData', () => ({ useTourLeaderboard: () => ({ data: f.rows }) }));
vi.mock('@/features/tourhub/hooks/useBatchCourseImages', () => ({ useBatchCourseImages: () => ({ data: new Map() }) }));
vi.mock('@/features/tourhub/hooks/useLiveTournaments', () => ({ useLiveTournaments: () => ({ data: f.live }) }));
vi.mock('@/features/tourhub/leaderboard/useTournamentMeta', () => ({ useTournamentMeta: (id: string | null) => ({ data: id ? { id, name: 'Event meta' } : undefined }) }));
vi.mock('@/features/tourhub/overview/magazineCopy', () => ({
  tournamentHeadlineSegments: () => [{ text: 'Sentence.' }],
  tournamentHeadline: () => null,
}));
vi.mock('@/features/tourhub/tournament-v2/sections/FullBoardSheet', () => ({
  FullBoardSheet: (props: { open: boolean; entries: unknown[]; meta: unknown }) => { f.sheet(props); return props.open ? <div data-testid="full-board-sheet" /> : null; },
}));

import { HeroBoardSection, pickTeeText } from '@/features/tourhub/components/overview-v3/HybridHeroBands/HeroBoardBand';
import { formatTimeHm, formatWeekdayShort } from '@/i18n/format';

const at = (days: number) => { const d = new Date(); d.setDate(d.getDate() + days); d.setHours(14, 5, 0, 0); return d.toISOString(); };
const idle = (id: string) => ({ id: `r${id}`, position: 1, position_tied: true, score: 0, player: { id, full_name: `Player ${id}` } }) as unknown as BoardEntry;
const mount = (entries: BoardEntry[], phase: 'live' | 'completed' = 'live') => render(
  <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
    <MemoryRouter>
      <HeroBoardSection tournamentId="event" entries={entries} phase={phase} currentRound={1} totalRounds={4} venuePar={72} />
    </MemoryRouter>
  </QueryClientProvider>,
);
const card = () => document.querySelector('[data-overview-pick-card]') as HTMLElement;

describe('picks tee line', () => {
  afterEach(() => { cleanup(); f.tees = { data: undefined }; });
  it('unstarted pick with a tee time today shows TEES and the time', () => {
    f.picks = [{ playerId: 'p1', playerName: 'Player p1' }];
    f.tees = { data: new Map([['p1', at(0)]]) };
    mount([idle('p1'), idle('p2')]);
    expect(card().querySelector('[data-overview-pick-tee]')).not.toBeNull();
    expect(card().querySelector('[data-overview-pick-tee-time]')?.textContent).toBe(formatTimeHm(at(0)));
  });
  it('tomorrow shows the weekday before the time', () => {
    expect(pickTeeText(at(1))).toBe(`${formatWeekdayShort(at(1)).toLocaleUpperCase()} ${formatTimeHm(at(1))}`);
    expect(pickTeeText(at(0))).toBe(formatTimeHm(at(0)));
  });
  it('a started pick shows position and score and no tee line', () => {
    f.picks = [{ playerId: 'p1', playerName: 'Player p1' }];
    f.tees = { data: new Map([['p1', at(0)]]) };
    mount([{ ...idle('p1'), score: -1, thru: 2, position_tied: false } as BoardEntry, { ...idle('p2'), position: 2 } as BoardEntry]);
    expect(card().querySelector('[data-overview-pick-figure]')).not.toBeNull();
    expect(card().querySelector('[data-overview-pick-tee]')).toBeNull();
  });
  it('no tee time, or a failed read, shows nothing', () => {
    f.picks = [{ playerId: 'p1', playerName: 'Player p1' }];
    mount([{ ...idle('p1'), position: null } as unknown as BoardEntry]);
    expect(card().querySelector('[data-overview-pick-tee]')).toBeNull();
    expect(card().querySelector('[data-overview-pick-figure]')).toBeNull();
  });
  it('a completed event is unchanged', () => {
    f.picks = [{ playerId: 'p1', playerName: 'Player p1' }];
    f.tees = { data: new Map([['p1', at(0)]]) };
    mount([{ ...idle('p1'), position: 1, position_tied: false, score: -10, round_1: -10 } as BoardEntry], 'completed');
    expect(card().querySelector('[data-overview-pick-tee]')).toBeNull();
    expect(card().querySelector('[data-overview-pick-figure]')).not.toBeNull();
  });
});

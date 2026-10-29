/* Tour overview not started: the picks intro claims no lead or level before
   anyone has a hole recorded. Mocks copied from tourOverviewPicksChipsFullBoard. */
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
}));
const tSpy = vi.hoisted(() => ({ keys: [] as string[] }));
vi.mock('react-i18next', () => ({ initReactI18next: { type: '3rdParty', init: () => {} }, useTranslation: () => ({ t: (_k: string, o?: { defaultValue?: string }) => { tSpy.keys.push(_k); return o?.defaultValue ?? ''; } }) }));
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

import { HeroBoardSection } from '@/features/tourhub/components/overview-v3/HybridHeroBands/HeroBoardBand';

const idle: BoardEntry[] = Array.from({ length: 6 }, (_, i) => ({
  id: `r${i}`, position: 1, position_tied: true, score: 0, total: 0,
  player: { id: `p${i}`, full_name: `Player ${i}` },
}) as unknown as BoardEntry);

const mount = (entries: BoardEntry[], round: number) => render(
  <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
    <MemoryRouter>
      <HeroBoardSection tournamentId="event" entries={entries} phase="live" currentRound={round} totalRounds={4} venuePar={72} />
    </MemoryRouter>
  </QueryClientProvider>,
);

describe('picks intro before anyone has started', () => {
  afterEach(() => { cleanup(); tSpy.keys.length = 0; });
  it('asks for no picks-intro sentence when nobody has started', () => {
    f.picks = [{ playerId: 'p0', playerName: 'Player 0' }];
    mount(idle, 1);
    expect(tSpy.keys.some((k) => k.startsWith('overview.picksIntro.'))).toBe(false);
  });
  it('asks for one once a row has started', () => {
    f.picks = [{ playerId: 'p0', playerName: 'Player 0' }];
    const started = idle.map((e, i) => (i === 0 ? { ...e, score: -1, total: -1, thru: 2, position_tied: false } : { ...e, position: 2 })) as BoardEntry[];
    mount(started, 1);
    expect(tSpy.keys.some((k) => k.startsWith('overview.picksIntro.'))).toBe(true);
  });
});

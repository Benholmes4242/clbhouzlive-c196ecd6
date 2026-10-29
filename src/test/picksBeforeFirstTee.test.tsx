/* BRIEF — PICKS AND THE BOARD BEFORE ANYONE HAS TEED OFF. Mocks copied from tourOverviewPicksTeeLine. */
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { BoardEntry } from '@/features/tourhub/leaderboard/BoardTable';

const f = vi.hoisted(() => ({
  picks: [] as Array<{ playerId: string; playerName: string }>,
  rows: [] as unknown[],
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
vi.mock('@/features/tourhub/hooks/useLiveTournaments', () => ({ useLiveTournaments: () => ({ data: [] }) }));
vi.mock('@/features/tourhub/leaderboard/useTournamentMeta', () => ({ useTournamentMeta: (id: string | null) => ({ data: id ? { id, name: 'Event meta' } : undefined }) }));
vi.mock('@/features/tourhub/overview/magazineCopy', () => ({ tournamentHeadlineSegments: () => [{ text: 'Sentence.' }], tournamentHeadline: () => null }));
vi.mock('@/features/tourhub/tournament-v2/sections/FullBoardSheet', () => ({ FullBoardSheet: () => null }));

import { HeroBoardSection } from '@/features/tourhub/components/overview-v3/HybridHeroBands/HeroBoardBand';

const tee = (() => { const d = new Date(); d.setHours(14, 5, 0, 0); return d.toISOString(); })();
/* The feed before the first tee: position 1, tied, score 0, no round, no thru. */
const idle = (id: string) => ({ id: `r${id}`, position: 1, position_tied: true, score: 0, player: { id, full_name: `Player ${id}` } }) as unknown as BoardEntry;
const field = (n = 6) => Array.from({ length: n }, (_, i) => idle(`p${i + 1}`));
const mount = (entries: BoardEntry[]) => render(
  <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
    <MemoryRouter>
      <HeroBoardSection tournamentId="event" entries={entries} phase="live" currentRound={1} totalRounds={4} venuePar={72} />
    </MemoryRouter>
  </QueryClientProvider>,
);
const card = () => document.querySelector('[data-overview-pick-card]') as HTMLElement;
const board = () => document.querySelector('[data-overview-board-header]');

describe('live picks before the pick has started', () => {
  afterEach(() => { cleanup(); f.tees = { data: undefined }; f.picks = []; });
  it('position 1 / score 0 / no round shows the tee line and no position or score', () => {
    f.picks = [{ playerId: 'p1', playerName: 'Player p1' }];
    f.tees = { data: new Map([['p1', tee]]) };
    mount(field());
    expect(card().querySelector('[data-overview-pick-tee]')).not.toBeNull();
    expect(card().querySelector('[data-overview-pick-figure]')).toBeNull();
    expect(card().textContent).not.toMatch(/T1|\bE\b/);
  });
  it('no known tee shows nothing under the name', () => {
    f.picks = [{ playerId: 'p1', playerName: 'Player p1' }];
    mount(field());
    const text = card().querySelector('[data-overview-pick-text]')!;
    expect(text.children.length).toBe(1);
  });
  it('no to-reach line before starting', () => {
    f.picks = [{ playerId: 'p1', playerName: 'Player p1' }];
    mount(field());
    expect(card().querySelector('[data-overview-pick-to-reach]')).toBeNull();
  });
  it('once rowHasStarted the card shows position and score', () => {
    f.picks = [{ playerId: 'p1', playerName: 'Player p1' }];
    f.tees = { data: new Map([['p1', tee]]) };
    mount([{ ...idle('p1'), score: -1, thru: 2, position_tied: false } as BoardEntry, ...field().slice(1)]);
    expect(card().querySelector('[data-overview-pick-figure]')?.textContent).toMatch(/1/);
    expect(card().querySelector('[data-overview-pick-tee]')).toBeNull();
  });
});

describe('the board before the first tee', () => {
  afterEach(() => cleanup());
  it('is hidden while no row has started', () => {
    mount(field());
    expect(board()).toBeNull();
  });
  it('is shown once a row has started', () => {
    mount([{ ...idle('p1'), score: -1, thru: 2, position_tied: false } as BoardEntry, ...field().slice(1)]);
    expect(board()).not.toBeNull();
  });
});

/* BRIEF_TOUR_OVERVIEW_PICKS_CHIPS_AND_FULL_BOARD — Board B outlined chips and
   the situation row's "Full board ›". Structure only; no translated words. */
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

import { HeroBoardSection } from '@/features/tourhub/components/overview-v3/HybridHeroBands/HeroBoardBand';
import { HybridHero } from '@/features/tourhub/components/overview-v3/HybridHero';
import type { HeroSlide } from '@/features/tourhub/hooks/useHeroCarouselData';

const field: BoardEntry[] = [1, 2, 3, 4, 5, 6, 7].map((position, i) => ({
  id: `r${i}`, position, position_tied: false, score: -10 + i, thru: 18,
  round_1: -2, round_2: -2, round_3: -2,
  player: { id: `p${i}`, full_name: `Player ${i}` },
}));

afterEach(() => { cleanup(); f.picks = []; f.rows = []; f.live = []; f.sheet.mockClear(); });

const mountPicks = (props: Partial<React.ComponentProps<typeof HeroBoardSection>> = {}) => render(
  <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
    <MemoryRouter>
      <HeroBoardSection tournamentId="event" entries={field} phase="live" currentRound={2} totalRounds={4} venuePar={72} {...props} />
    </MemoryRouter>
  </QueryClientProvider>,
);

describe('picks chips (Board B)', () => {
  it('render three across with no fill, a 1px outline and no chevron', () => {
    f.picks = [{ playerId: 'p0', playerName: 'A Zero' }, { playerId: 'p3', playerName: 'B Three' }, { playerId: 'p5', playerName: 'C Five' }, { playerId: 'p6', playerName: 'D Six' }];
    const { container } = mountPicks();
    const grid = container.querySelector('[data-overview-picks-grid]') as HTMLElement;
    expect(grid.style.gridTemplateColumns).toBe('repeat(3, minmax(0, 1fr))');
    expect(grid.style.gap).toBe('6px');
    const cards = container.querySelectorAll<HTMLElement>('[data-overview-pick-card]');
    expect(cards).toHaveLength(3);
    cards.forEach((card) => {
      expect(card.style.background).toBe('transparent');
      expect(card.style.border).toBe('1px solid rgba(255,255,255,0.12)');
      expect(card.style.borderRadius).toBe('12px');
      expect(card.style.display).toBe('flex');
      expect(card.querySelector('.lucide-chevron-right')).toBeNull();
    });
  });

  it('puts the 30px avatar left of the name', () => {
    f.picks = [{ playerId: 'p3', playerName: 'B Three' }];
    const { container } = mountPicks();
    const card = container.querySelector('[data-overview-pick-card]') as HTMLElement;
    const avatar = card.querySelector('[data-overview-pick-avatar]') as HTMLElement;
    const text = card.querySelector('[data-overview-pick-text]') as HTMLElement;
    expect(card.firstElementChild).toBe(avatar);
    expect(avatar.nextElementSibling).toBe(text);
    expect(avatar.style.flex).toBe('0 0 auto');
    const sized = avatar.querySelector<HTMLElement>('[style*="30px"]');
    expect(sized).not.toBeNull();
  });

  it('a live pick shows position and score on line 2', () => {
    f.picks = [{ playerId: 'p3', playerName: 'B Three' }];
    const { container } = mountPicks();
    const figure = container.querySelector('[data-overview-pick-figure]') as HTMLElement;
    expect(figure.textContent).toBe('4\u22127');
    expect(figure.previousElementSibling?.hasAttribute('data-overview-pick-name')).toBe(true);
  });

  it('the to-reach line renders as one line only when its condition holds', () => {
    f.picks = [{ playerId: 'p0', playerName: 'A Zero' }, { playerId: 'p3', playerName: 'B Three' }];
    const { container } = mountPicks({ currentRound: 3 });
    const cards = container.querySelectorAll('[data-overview-pick-card]');
    expect(cards[0].querySelector('[data-overview-pick-to-reach]')).toBeNull(); // the leader has nothing to reach
    const line = cards[1].querySelector('[data-overview-pick-to-reach]') as HTMLElement;
    expect(line).not.toBeNull();
    expect(line.children).toHaveLength(0);
    expect(line.style.whiteSpace).toBe('nowrap');
    expect(line.style.textOverflow).toBe('ellipsis');
    expect(line.style.borderTop).toBe('');
    cleanup();
    const early = mountPicks({ currentRound: 2 });
    expect(early.container.querySelector('[data-overview-pick-to-reach]')).toBeNull();
  });

  it('a long surname ellipsises on one line', () => {
    f.picks = [{ playerId: 'p3', playerName: 'Christiaan Bezuidenhoutvanderwesthuizen' }];
    const { container } = mountPicks();
    const name = container.querySelector('[data-overview-pick-name]') as HTMLElement;
    expect(name.style.whiteSpace).toBe('nowrap');
    expect(name.style.overflow).toBe('hidden');
    expect(name.style.textOverflow).toBe('ellipsis');
    expect((name.parentElement as HTMLElement).style.minWidth).toBe('0');
  });
});

const slide = (eventType = 'stroke'): HeroSlide => ({
  type: 'live',
  tournament: { id: 'evt', name: 'Event', tourSlug: 'pga', startDate: '2026-10-22', endDate: '2026-10-25', eventType } as HeroSlide['tournament'],
});
const LIVE: HeroState = { kind: 'live', round: 2, totalRounds: 4 };
const PLAYOFF: HeroState = { kind: 'results', variant: 'awaiting-playoff', finishDate: '2026-10-25', meta: '' };
const UPCOMING: HeroState = { kind: 'upcoming', variant: 'far', countdown: '', meta: '' };

function mountHero(state: HeroState, onOpenTournament = vi.fn(), s = slide()) {
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <MemoryRouter initialEntries={['/tourhub']}>
        <Routes>
          <Route path="/tourhub" element={<HybridHero slide={s} state={state} now={new Date('2026-10-20T00:00:00Z')} activeTournamentId="evt" onSelectTour={() => {}} onOpenTournament={onOpenTournament} />} />
          <Route path="/tourhub-live" element={null} />
        </Routes>
        <LocationProbe />
      </MemoryRouter>
    </QueryClientProvider>,
  );
  return onOpenTournament;
}
function LocationProbe() {
  const loc = useLocation();
  return <div data-testid="loc">{loc.pathname + loc.search}</div>;
}

describe('situation row "Full board"', () => {
  it('renders for live and completed (awaiting-playoff) events with a board, never for upcoming', () => {
    f.rows = field;
    mountHero(LIVE);
    expect(document.querySelector('[data-overview-situation] [data-overview-full-board]')).not.toBeNull();
    cleanup();
    mountHero(PLAYOFF);
    expect(document.querySelector('[data-overview-full-board]')).not.toBeNull();
    cleanup();
    mountHero(UPCOMING);
    expect(document.querySelector('[data-overview-situation]')).not.toBeNull();
    expect(document.querySelector('[data-overview-full-board]')).toBeNull();
  });

  it('is absent without a stroke board', () => {
    f.rows = field;
    mountHero(LIVE, vi.fn(), slide('cup'));
    expect(document.querySelector('[data-overview-full-board]')).toBeNull();
    cleanup();
    f.rows = [];
    mountHero(LIVE);
    expect(document.querySelector('[data-overview-full-board]')).toBeNull();
  });

  it('has a 44px target that leaves the row height unchanged', () => {
    f.rows = field;
    mountHero(LIVE);
    const button = screen.getByRole('button', { name: 'Full leaderboard' });
    expect(button.style.padding).toBe('12px 0px 12px 12px');
    expect(button.style.margin).toBe('-12px 0px');
  });

  it('live and in the live list navigates to the live leaderboard deep link', () => {
    f.rows = field; f.live = [{ id: 'evt' }];
    mountHero(LIVE);
    fireEvent.click(screen.getByRole('button', { name: 'Full leaderboard' }));
    expect(screen.getByTestId('loc').textContent).toBe('/tourhub?tab=live&event=evt');
    expect(screen.queryByTestId('full-board-sheet')).toBeNull();
  });

  it('completed opens FullBoardSheet with the full field and meta', () => {
    f.rows = field; f.live = [{ id: 'evt' }];
    mountHero(PLAYOFF);
    fireEvent.click(screen.getByRole('button', { name: 'Full leaderboard' }));
    expect(screen.getByTestId('full-board-sheet')).toBeInTheDocument();
    const last = f.sheet.mock.calls.at(-1)?.[0] as { entries: unknown[]; meta: { id: string } };
    expect(last.entries).toHaveLength(7);
    expect(last.meta.id).toBe('evt');
    expect(screen.getByTestId('loc').textContent).toBe('/tourhub');
  });

  it('the photo band still opens the tournament page', () => {
    f.rows = field;
    const onOpen = mountHero(LIVE);
    fireEvent.click(document.querySelector('[data-overview-photo-band]') as HTMLElement);
    expect(onOpen).toHaveBeenCalledTimes(1);
  });
});

describe('Full board before anyone has teed off', () => {
  const unstarted = Array.from({ length: 6 }, (_, i) => ({ id: `u${i}`, position: 1, position_tied: true, score: 0, today: null, thru: null, player: { id: `p${i}`, full_name: `Player ${i}` } }));
  it('shows no full-board entry and mounts no FullBoardSheet before the first tee', () => {
    f.rows = unstarted;
    mountHero(LIVE);
    expect(document.querySelector('[data-overview-full-board]')).toBeNull();
    expect(f.sheet).not.toHaveBeenCalled();
  });
  it('shows both once one row has started', () => {
    f.rows = [{ ...unstarted[0], thru: 1 }, ...unstarted.slice(1)];
    mountHero(LIVE);
    expect(document.querySelector('[data-overview-full-board]')).not.toBeNull();
    expect(f.sheet).toHaveBeenCalled();
  });
});

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
  picksSheet: vi.fn(),
}));
vi.mock('react-i18next', () => ({ initReactI18next: { type: '3rdParty', init: () => {} }, useTranslation: () => ({ t: (_k: string, o?: { defaultValue?: string }) => o?.defaultValue ?? '' }) }));
vi.mock('@/features/tourhub/context/TourSelectionContext', () => ({ useTourSelection: () => ({ viewingTournamentId: null, viewingTourSlug: 'pga' }) }));
vi.mock('@/features/tourhub/hooks/useAIPredictions', () => ({ useAIPredictions: () => ({ data: f.picks.length ? { topContenders: f.picks, tournament: { name: 'Event' } } : null }) }));
vi.mock('@/features/tourhub/hooks/useTournamentTeeTimes', () => ({ useTournamentTeeTimes: () => ({ data: [] }) }));
vi.mock('@/features/tourhub/hooks/useTournamentLastYearTop4', () => ({ useTournamentLastYearTop4: () => ({ data: [] }) }));
vi.mock('@/features/tourhub/overview/data/useTournamentVenueRecord', () => ({ useTournamentVenueRecord: () => ({ data: null }) }));
vi.mock('@/features/tourhub/tournament-v2/data/useDrawnRounds', () => ({ useDrawnRounds: () => ({ data: [] }) }));
vi.mock('@/features/tourhub/tournament-v2/data/useTeeTimesAll', () => ({ useTeeTimesAll: () => ({ data: [] }) }));
vi.mock('@/features/tourhub/components/overview-v3/HybridHeroBands/PicksSheet', () => ({ PicksSheet: (props: { open: boolean; initialPlayerId: string | null }) => { f.picksSheet(props); return null; } }));
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

import { HeroBoardSection, RoundMovementBand } from '@/features/tourhub/components/overview-v3/HybridHeroBands/HeroBoardBand';
import { EMPTY_OVERVIEW_SHAPE, TourOverviewShell } from '@/features/tourhub/components/overview-v3/overviewShells';
import { EVEN_ROW_GRID } from '@/features/tourhub/components/overview-v3/overviewTokens';
import { HybridHero } from '@/features/tourhub/components/overview-v3/HybridHero';
import type { HeroSlide } from '@/features/tourhub/hooks/useHeroCarouselData';

const field: BoardEntry[] = [1, 2, 3, 4, 5, 6, 7].map((position, i) => ({
  id: `r${i}`, position, position_tied: false, score: -10 + i, thru: 18,
  round_1: -2, round_2: -2, round_3: -2,
  player: { id: `p${i}`, full_name: `Player ${i}` },
}));

afterEach(() => { cleanup(); f.picks = []; f.rows = []; f.live = []; f.sheet.mockClear(); f.picksSheet.mockClear(); });

const mountPicks = (props: Partial<React.ComponentProps<typeof HeroBoardSection>> = {}) => render(
  <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
    <MemoryRouter>
      <HeroBoardSection tournamentId="event" entries={field} phase="live" currentRound={2} totalRounds={4} venuePar={72} {...props} />
    </MemoryRouter>
  </QueryClientProvider>,
);

describe('picks chips (Board B)', () => {
  it('render three across the even row with no tile and no chevron', () => {
    f.picks = [{ playerId: 'p0', playerName: 'A Zero' }, { playerId: 'p3', playerName: 'B Three' }, { playerId: 'p5', playerName: 'C Five' }, { playerId: 'p6', playerName: 'D Six' }];
    const { container } = mountPicks();
    const grid = container.querySelector('[data-overview-picks-grid]') as HTMLElement;
    expect(grid.style.gridTemplateColumns).toBe(EVEN_ROW_GRID);
    expect(grid.style.paddingLeft).toBe('0px');
    expect(grid.style.paddingRight).toBe('0px');
    const cards = container.querySelectorAll<HTMLElement>('[data-overview-pick-card]');
    expect(cards).toHaveLength(3);
    expect([...cards].map(c => c.style.gridColumn)).toEqual(['2', '4', '6']);
    cards.forEach((card) => {
      expect(card.style.background).toBe('transparent');
      expect(card.style.border).toBe('');
      expect(card.style.borderRadius).toBe('');
      expect(card.style.padding).toBe('0px');
      expect(card.style.display).toBe('flex');
      expect(card.querySelector('.lucide-chevron-right')).toBeNull();
    });
  });

  it('(a) the three-mover row and the three-pick grid both use the seven-track even row', () => {
    const movers = render(<RoundMovementBand round={2} cards={['a', 'b', 'c'].map(k => ({ key: k, name: `Player ${k}`, candidates: [], delta: 2, toPar: -2, gross: 70 }))} />);
    const mRow = movers.container.querySelector<HTMLElement>('[data-overview-movement-row]')!;
    expect(mRow.style.gridTemplateColumns).toBe(EVEN_ROW_GRID);
    expect([...movers.container.querySelectorAll<HTMLElement>('[data-overview-movement-card]')].map(c => c.style.gridColumn)).toEqual(['2', '4', '6']);
    cleanup();
    f.picks = [{ playerId: 'p0', playerName: 'A Zero' }, { playerId: 'p3', playerName: 'B Three' }, { playerId: 'p5', playerName: 'C Five' }];
    const picks = mountPicks();
    const grid = picks.container.querySelector('[data-overview-picks-grid]') as HTMLElement;
    expect(grid.style.gridTemplateColumns).toBe(EVEN_ROW_GRID);
    expect([...picks.container.querySelectorAll<HTMLElement>('[data-overview-pick-card]')].map(c => c.style.gridColumn)).toEqual(['2', '4', '6']);
  });

  it('(b) two picks use the centred pair and one pick is centred', () => {
    f.picks = [{ playerId: 'p0', playerName: 'A Zero' }, { playerId: 'p3', playerName: 'B Three' }];
    const two = mountPicks();
    const twoGrid = two.container.querySelector('[data-overview-picks-grid]') as HTMLElement;
    expect(twoGrid.style.display).toBe('grid');
    expect(twoGrid.style.columnGap).toBe('32px');
    expect(twoGrid.style.padding).toBe('0px 20px');
    const twoCards = two.container.querySelectorAll<HTMLElement>('[data-overview-pick-card]');
    expect(twoCards).toHaveLength(2);
    expect(twoCards[0].style.justifySelf).toBe('end');
    expect(twoCards[1].style.justifySelf).toBe('start');
    cleanup();
    f.picks = [{ playerId: 'p3', playerName: 'B Three' }];
    const one = mountPicks();
    const oneGrid = one.container.querySelector('[data-overview-picks-grid]') as HTMLElement;
    expect(oneGrid.style.display).toBe('flex');
    expect(oneGrid.style.justifyContent).toBe('center');
    expect(oneGrid.style.padding).toBe('0px');
    expect(one.container.querySelectorAll('[data-overview-pick-card]')).toHaveLength(1);
  });

  it('(c) there is no picks hairline and no separator in the picks shell', () => {
    f.picks = [{ playerId: 'p0', playerName: 'A Zero' }];
    const { container } = mountPicks();
    expect(container.querySelector('[data-overview-picks-hairline]')).toBeNull();
    cleanup();
    const shell = render(<TourOverviewShell shape={{ ...EMPTY_OVERVIEW_SHAPE, picks: { recordLines: 1, sentenceLines: 1 } } as never} />);
    const picks = shell.container.querySelector<HTMLElement>('[data-tour-shell="picks"]')!;
    expect(picks.querySelector('[data-overview-picks-hairline]')).toBeNull();
    expect([...picks.children].every(c => (c as HTMLElement).style.borderTop === '')).toBe(true);
  });

  it('(d) a pick card is still a button that opens the pick on tap', () => {
    f.picks = [{ playerId: 'p3', playerName: 'B Three' }, { playerId: 'p5', playerName: 'C Five' }];
    const { container } = mountPicks();
    const card = container.querySelector<HTMLElement>('[data-overview-pick-card]')!;
    expect(card.tagName).toBe('BUTTON');
    expect(card.getAttribute('type')).toBe('button');
    f.picksSheet.mockClear();
    fireEvent.click(card);
    expect(f.picksSheet.mock.calls.some(c => c[0].open === true && c[0].initialPlayerId === 'p3')).toBe(true);
  });

  it('puts the 28px avatar left of the name', () => {
    f.picks = [{ playerId: 'p3', playerName: 'B Three' }];
    const { container } = mountPicks();
    const card = container.querySelector('[data-overview-pick-card]') as HTMLElement;
    const avatar = card.querySelector('[data-overview-pick-avatar]') as HTMLElement;
    const text = card.querySelector('[data-overview-pick-text]') as HTMLElement;
    expect(card.firstElementChild).toBe(avatar);
    expect(avatar.nextElementSibling).toBe(text);
    expect(avatar.style.flex).toBe('0 0 auto');
    const sized = avatar.querySelector<HTMLElement>('[style*="28px"]');
    expect(sized).not.toBeNull();
  });

  it('a live pick shows position and score on line 2', () => {
    f.picks = [{ playerId: 'p3', playerName: 'B Three' }];
    const { container } = mountPicks();
    const figure = container.querySelector('[data-overview-pick-figure]') as HTMLElement;
    expect(figure.textContent).toBe('4\u22127');
    expect(figure.previousElementSibling?.hasAttribute('data-overview-pick-name')).toBe(true);
  });

  it('the to-reach line stays absent even in the required-round window', () => {
    f.picks = [{ playerId: 'p0', playerName: 'A Zero' }, { playerId: 'p3', playerName: 'B Three' }];
    const { container } = mountPicks({ currentRound: 3 });
    const cards = container.querySelectorAll('[data-overview-pick-card]');
    expect(cards[0].querySelector('[data-overview-pick-to-reach]')).toBeNull(); // the leader has nothing to reach
    expect(cards[1].querySelector('[data-overview-pick-to-reach]')).toBeNull();
    const figure = cards[1].querySelector('[data-overview-pick-figure]') as HTMLElement;
    expect(figure.style.marginTop).toBe('1px');
    expect(figure.style.lineHeight).toBe('1.2');
    expect(figure.style.whiteSpace).toBe('nowrap');
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

  it('uses a 46px border-box chip for a pre-round tee with a 1px gap', () => {
    f.picks = [{ playerId: 'p3', playerName: 'B Three' }];
    const { container } = mountPicks({ phase: 'upcoming', entries: [] });
    const card = container.querySelector<HTMLElement>('[data-overview-pick-card]');
    expect(card?.style.height).toBe('46px');
    expect(card?.style.boxSizing).toBe('border-box');
    const text = card?.querySelector<HTMLElement>('[data-overview-pick-text]');
    expect(['1', '1 1 0%']).toContain(text?.style.flex);
    expect(text?.style.overflow).toBe('hidden');
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

/* BUILD_TOUR_BUTTONS_UNDER_HERO §3 — the "Full board ›" kicker link is gone
   in EVERY state; the Full leaderboard button under the board (OverviewHero)
   owns that navigation. These replaced the five tests that pinned the link
   (rendering, stroke-board gate, 44px target, live deep link, completed
   sheet) and the two before-first-tee tests. */
describe('no "Full board" link on the photo band', () => {
  it('is absent for live, completed (awaiting-playoff) and upcoming heroes alike', () => {
    f.rows = field;
    mountHero(LIVE);
    expect(document.querySelector('[data-overview-full-board]')).toBeNull();
    expect(screen.queryByRole('button', { name: 'Full leaderboard' })).toBeNull();
    cleanup();
    mountHero(PLAYOFF);
    expect(document.querySelector('[data-overview-full-board]')).toBeNull();
    expect(screen.queryByRole('button', { name: 'Full leaderboard' })).toBeNull();
    cleanup();
    mountHero(UPCOMING);
    expect(document.querySelector('[data-overview-photo-situation]')).toBeNull();
    expect(document.querySelector('[data-overview-situation]')).toBeNull();
    expect(document.querySelector('[data-overview-full-board]')).toBeNull();
  });

  it('stays absent whatever the format or board, and HybridHero mounts no FullBoardSheet', () => {
    f.rows = field;
    mountHero(LIVE, vi.fn(), slide('cup'));
    expect(document.querySelector('[data-overview-full-board]')).toBeNull();
    cleanup();
    f.rows = [];
    mountHero(LIVE);
    expect(document.querySelector('[data-overview-full-board]')).toBeNull();
    cleanup();
    f.rows = field; f.live = [{ id: 'evt' }];
    mountHero(PLAYOFF);
    expect(document.querySelector('[data-overview-full-board]')).toBeNull();
    expect(f.sheet).not.toHaveBeenCalled();
  });

  it('the photo band still opens the tournament page', () => {
    f.rows = field;
    const onOpen = mountHero(LIVE);
    fireEvent.click(document.querySelector('[data-overview-photo-band]') as HTMLElement);
    expect(onOpen).toHaveBeenCalledTimes(1);
  });
});

describe('no full-board entry around the first tee', () => {
  const unstarted = Array.from({ length: 6 }, (_, i) => ({ id: `u${i}`, position: 1, position_tied: true, score: 0, today: null, thru: null, player: { id: `p${i}`, full_name: `Player ${i}` } }));
  it('no entry and no FullBoardSheet before the first tee', () => {
    f.rows = unstarted;
    mountHero(LIVE);
    expect(document.querySelector('[data-overview-full-board]')).toBeNull();
    expect(f.sheet).not.toHaveBeenCalled();
  });
  it('still none once one row has started', () => {
    f.rows = [{ ...unstarted[0], thru: 1 }, ...unstarted.slice(1)];
    mountHero(LIVE);
    expect(document.querySelector('[data-overview-full-board]')).toBeNull();
    expect(f.sheet).not.toHaveBeenCalled();
  });
});

describe('a pick with a non-scoring status shows the pick token', () => {
  const withStatus = (statuses: Record<string, string>) => field.map((e) => ({ ...e, status: statuses[String(e.player?.id)] ?? 'active' }));
  const cases: Array<[string, string]> = [['WD', 'WD'], ['DQ', 'DQ'], ['CUT', 'MC'], ['MC', 'MC'], ['MDF', 'MDF'], ['DNS', 'DNS']];
  it.each(['live', 'completed'] as const)('in %s events: token in place of position, no score, no numeral', (phase) => {
    for (const [raw, token] of cases) {
      f.picks = [{ playerId: 'p1', playerName: 'A One' }, { playerId: 'p2', playerName: 'B Two' }];
      const { container } = mountPicks({ phase, entries: withStatus({ p1: raw }), currentRound: 3 });
      const cards = container.querySelectorAll('[data-overview-pick-card]');
      const fig = cards[0].querySelector('[data-overview-pick-figure]') as HTMLElement;
      expect(fig.textContent).toBe(token);
      expect(fig.textContent).not.toMatch(/\d/);
      expect((fig.querySelector('[data-overview-pick-status]') as HTMLElement).style.color).toBe('rgba(255, 255, 255, 0.65)');
      expect(cards[0].querySelector('[data-overview-pick-to-reach]')).toBeNull();
      expect(cards[0].querySelector('[data-overview-pick-tee]')).toBeNull();
      // An active pick is unchanged.
      expect(cards[1].querySelector('[data-overview-pick-status]')).toBeNull();
      expect(cards[1].querySelector('[data-overview-pick-figure]')?.textContent).toMatch(/\d/);
      cleanup();
    }
  });
});

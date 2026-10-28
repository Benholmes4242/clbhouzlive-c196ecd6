/**
 * BRIEF_TOUR_ISLAND — the Tour island, its tile and the shared row model.
 * Structure is asserted, never translated words: the react-i18next mock is
 * the canonical one (initReactI18next required at module load).
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';

vi.mock('react-i18next', () => ({
  initReactI18next: { type: '3rdParty', init: () => {} },
  useTranslation: () => ({ t: (_k: string, o?: { defaultValue?: string }) => o?.defaultValue ?? _k }),
}));

// ---- Controllable data mocks -------------------------------------------
const heroSlides: { data: unknown[] } = { data: [] };
const cacheData: { data: unknown } = { data: { upcoming: [], live: [], completed: [] } };
const activeMajor: { data: { id: string; name: string; startDate: string; status: 'live' | 'upcoming' } | null } = { data: null };
const liveTours: { data: { id: string; status: string; currentRound: number | null }[]; isFetched: boolean } = { data: [], isFetched: true };
const selection = {
  selectedTourSlug: 'all' as string | null,
  viewingTourSlug: null as string | null,
  viewingTournamentId: null as string | null,
  appliedTourSlug: 'all' as string | null,
  acceptable: true,
  selectTour: vi.fn(),
};

vi.mock('@/features/tourhub/hooks/useHeroCarouselData', () => ({
  useHeroCarouselData: () => ({ data: heroSlides.data }),
}));
vi.mock('@/hooks/useTournamentsCache', () => ({
  useTournamentsCache: () => ({ data: cacheData.data }),
}));
vi.mock('@/features/tourhub/hooks/useActiveMensMajor', () => ({
  useActiveMensMajor: () => activeMajor.data,
}));
vi.mock('@/features/tourhub/hooks/useLiveTournaments', () => ({
  useLiveTournaments: () => ({ data: liveTours.data, isFetched: liveTours.isFetched }),
}));
vi.mock('@/features/tourhub/context/TourSelectionContext', () => ({
  useTourSelection: () => ({
    selectedTourSlug: selection.selectedTourSlug,
    viewingTourSlug: selection.viewingTourSlug,
    viewingTournamentId: selection.viewingTournamentId,
    appliedTourSlug: selection.appliedTourSlug,
    isSlugAcceptable: () => selection.acceptable,
    selectTour: selection.selectTour,
  }),
}));

import { TourIsland } from '@/features/tourhub/components/TourIsland';
import { TourGlance } from '@/features/chrome-v2/TourGlance';
import { islandDescriptor, shortWeekday, singleTourCaption, allToursCaption, TOUR_DISPLAY } from '@/features/tourhub/components/tourIslandRules';
import type { TourPickerRow } from '@/features/tourhub/hooks/useTourPickerRows';

const slide = (id: string, tourSlug: string, type: 'live' | 'completed' | 'upcoming', name = `${tourSlug} event`) => ({
  tournament: { id, name, tourSlug, startDate: '2026-03-05', currentRound: type === 'live' ? 3 : null },
  type,
});

const baseRow = (over: Partial<TourPickerRow>): TourPickerRow => ({
  key: 'x', slug: 'pga', tournamentId: 't1', status: 'live', eventName: 'Event',
  startDate: '2026-03-05', currentRound: 3, acceptable: true, selected: false, disabled: false,
  ...over,
});

beforeEach(() => {
  cleanup();
  heroSlides.data = [];
  cacheData.data = { upcoming: [], live: [], completed: [] };
  activeMajor.data = null;
  liveTours.data = [];
  liveTours.isFetched = true;
  selection.selectedTourSlug = 'all';
  selection.viewingTourSlug = null;
  selection.viewingTournamentId = null;
  selection.appliedTourSlug = 'all';
  selection.acceptable = true;
  selection.selectTour.mockReset();
});

describe('tourIslandRules — captions and labels', () => {
  it('uses the sentence-case display map, never uppercase', () => {
    expect(TOUR_DISPLAY.all).toBe('All tours');
    expect(TOUR_DISPLAY.pga).toBe('PGA Tour');
    expect(TOUR_DISPLAY.euro).toBe('DP World Tour');
    expect(TOUR_DISPLAY.pgad).toBe('Korn Ferry');
    expect(TOUR_DISPLAY.liv).toBe('LIV Golf');
  });

  it('builds the single-tour captions for each status', () => {
    expect(singleTourCaption('live', 3, null)).toEqual({ text: 'Live · Round 3', live: true });
    expect(singleTourCaption('live', null, null)).toEqual({ text: 'Live', live: true });
    expect(singleTourCaption('completed', null, null)).toEqual({ text: 'Final', live: false });
    expect(singleTourCaption('upcoming', null, '2026-03-05')).toEqual({ text: 'Starts Thu', live: false });
    expect(singleTourCaption('season', null, null)).toEqual({ text: 'Season complete', live: false });
    expect(singleTourCaption('none', null, null)).toEqual({ text: 'No event this week', live: false });
  });

  it('shortWeekday pins the weekday against date-line drift', () => {
    expect(shortWeekday('2026-03-05')).toBe('Thu');
    expect(shortWeekday('2026-03-09')).toBe('Mon');
  });

  it('all-tours caption counts live first, then events this week', () => {
    const rows = [baseRow({ status: 'live' }), baseRow({ slug: 'lpga', status: 'upcoming' })];
    expect(allToursCaption(rows)).toEqual({ text: '1 live', live: true });
    expect(allToursCaption([baseRow({ status: 'upcoming' }), baseRow({ slug: 'lpga', status: 'completed' })]))
      .toEqual({ text: '2 events this week', live: false });
  });

  it('leaderboards tab describes itself, never a tour', () => {
    const d = islandDescriptor({ activeTab: 'live', activeTourSlug: 'pga', rows: [], liveCount: 2, major: null, liveRound: () => null });
    expect(d.label).toBe('Leaderboards');
    expect(d.caption).toBe('2 live');
    expect(d.captionLive).toBe(true);
    expect(d.glyph).toBe('trophy');
  });

  it('a specific tour carries its logo slug and status caption', () => {
    const d = islandDescriptor({
      activeTab: 'overview', activeTourSlug: 'pga',
      rows: [baseRow({})], liveCount: 1, major: null, liveRound: () => 3,
    });
    expect(d.label).toBe('PGA Tour');
    expect(d.caption).toBe('Live · Round 3');
    expect(d.logoSlug).toBe('pga');
  });
});

describe('TourIsland', () => {
  const noop = () => {};

  it('renders the sentence-case label and caption in one button', () => {
    const { container } = render(
      <TourIsland label="PGA Tour" caption="Live · Round 3" captionLive logoSlug="pga" glyph={null} mode="menu" onOpen={noop} />,
    );
    const btn = screen.getByRole('button');
    expect(btn.textContent).toContain('PGA Tour');
    expect(btn.textContent).toContain('Live · Round 3');
    expect(btn.getAttribute('data-island-flush')).toBe('true');
    expect(container.querySelector('img')).not.toBeNull();
  });

  it('back mode swaps the chip for a back control with no chevron affordance', () => {
    const onBack = vi.fn();
    render(<TourIsland label="PGA Tour" caption="Final" captionLive={false} logoSlug="pga" glyph={null} mode="back" onBackTap={onBack} onOpen={noop} />);
    const back = screen.getByLabelText('Back');
    fireEvent.click(back);
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it('hands its own element to onOpen so the tile can anchor left', () => {
    const onOpen = vi.fn();
    render(<TourIsland label="All tours" caption="2 live" captionLive logoSlug={null} glyph="globe" mode="menu" onOpen={onOpen} />);
    fireEvent.click(screen.getByRole('button'));
    expect(onOpen).toHaveBeenCalledTimes(1);
    expect(onOpen.mock.calls[0][0]).toBeInstanceOf(HTMLElement);
  });
});

describe('TourGlance', () => {
  const anchorRef = { current: document.createElement('div') } as React.RefObject<HTMLElement>;

  const renderGlance = (props: Partial<React.ComponentProps<typeof TourGlance>> = {}) =>
    render(
      <MemoryRouter>
        <TourGlance onClose={vi.fn()} anchorRef={anchorRef} activeTab="overview" onSelectTab={vi.fn()} {...props} />
      </MemoryRouter>,
    );

  it('shows the six section tiles when something is live, five otherwise', () => {
    liveTours.data = [{ id: 't1', status: 'inprogress', currentRound: 2 }];
    const { unmount } = renderGlance();
    expect(screen.getByTestId('tour-glance-sections').querySelectorAll('button')).toHaveLength(6);
    unmount();
    liveTours.data = [];
    renderGlance();
    expect(screen.getByTestId('tour-glance-sections').querySelectorAll('button')).toHaveLength(5);
  });

  it('lists tour rows from the shared model and selects through selectTour', () => {
    heroSlides.data = [slide('t1', 'pga', 'live', 'The Players')];
    const onClose = vi.fn();
    renderGlance({ onClose });
    const rows = screen.getByTestId('tour-glance-rows').querySelectorAll('button');
    expect(rows).toHaveLength(7); // All tours + one row per tour slug
    const pgaRow = screen.getByTestId('tour-glance-rows').querySelector('[data-tour-row="pga"]') as HTMLButtonElement;
    expect(pgaRow.textContent).toContain('The Players');
    fireEvent.click(pgaRow);
    expect(selection.selectTour).toHaveBeenCalledWith('pga', { tournamentId: 't1' });
    expect(onClose).toHaveBeenCalled();
  });

  it('marks the tour in view with the check and dims unacceptable rows', () => {
    selection.appliedTourSlug = 'pga';
    heroSlides.data = [slide('t1', 'pga', 'live')];
    const { unmount } = renderGlance();
    const selected = screen.getByTestId('tour-glance-rows').querySelector('[data-tour-row="pga"]') as HTMLButtonElement;
    expect(selected.getAttribute('aria-pressed')).toBe('true');
    unmount();
    selection.acceptable = false;
    heroSlides.data = [slide('t1', 'pga', 'live')];
    renderGlance();
    const dimmed = screen.getByTestId('tour-glance-rows').querySelector('[data-tour-row="pga"]') as HTMLButtonElement;
    expect(dimmed.disabled).toBe(true);
    expect(dimmed.style.opacity).toBe('0.45');
  });

  it('the leaderboards tab shows sections only, with no tour list', () => {
    heroSlides.data = [slide('t1', 'pga', 'live')];
    renderGlance({ activeTab: 'live', sectionsOnly: true });
    expect(screen.queryByTestId('tour-glance-rows')).toBeNull();
    expect(screen.getByTestId('tour-glance-sections')).not.toBeNull();
  });

  it('anchors left to the left island, not the right', () => {
    const left = document.createElement('div');
    left.setAttribute('data-island-left', '');
    left.getBoundingClientRect = () => ({ left: 14, right: 200, bottom: 60, top: 14, width: 186, height: 46, x: 14, y: 14, toJSON: () => ({}) } as DOMRect);
    const anchor = document.createElement('button');
    left.appendChild(anchor);
    document.body.appendChild(left);
    render(
      <MemoryRouter>
        <TourGlance onClose={vi.fn()} anchorRef={{ current: anchor }} activeTab="overview" onSelectTab={vi.fn()} sectionsOnly />
      </MemoryRouter>,
    );
    const card = document.querySelector('.index-glance-shell') as HTMLElement;
    expect(card.style.left).toBe('14px');
    expect(card.style.right).toBe('');
    expect(card.style.top).toBe('70px');
    expect(card.style.width).toBe('316px');
    document.body.removeChild(left);
  });
});

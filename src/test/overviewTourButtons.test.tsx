/* BUILD_TOUR_BUTTONS_UNDER_HERO — the tour chip row under the overview hero
   (option A) and the removal of the "Full board ›" kicker link. Structure
   only; no translated words. */
import React from 'react';
import { readFileSync } from 'node:fs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { HeroSlide } from '@/features/tourhub/hooks/useHeroCarouselData';

const f = vi.hoisted(() => ({
  slides: [] as HeroSlide[],
  heroSlides: [] as Array<string | undefined>,
  selection: {
    selectedTourSlug: 'all' as string | null,
    selectedTournamentId: null as string | null,
    selectionNonce: 0,
    setViewingTourSlug: vi.fn(),
    setViewingTournamentId: vi.fn(),
    setViewingIsLive: vi.fn(),
  },
}));

vi.mock('react-i18next', () => ({ initReactI18next: { type: '3rdParty', init: () => {} }, useTranslation: () => ({ t: (_k: string, o?: { defaultValue?: string }) => o?.defaultValue ?? '' }) }));
vi.mock('@/features/tourhub/hooks/useHeroCarouselData', () => ({ useHeroCarouselData: () => ({ data: f.slides, isLoading: false }) }));
vi.mock('@/features/tourhub/hooks/useTourHubData', () => ({ useTourLeaderboard: () => ({ data: [] }) }));
vi.mock('@/features/tourhub/context/TourSelectionContext', () => ({ useTourSelection: () => f.selection }));
vi.mock('@/features/tourhub/hooks/useLeaderboardRealtime', () => ({ useLeaderboardRealtime: () => {} }));
vi.mock('@/features/tourhub/components/overview-v3/useHeroFullBoard', () => ({ useHeroFullBoard: () => ({ open: false, onOpen: vi.fn(), onClose: vi.fn(), meta: null }) }));
vi.mock('@/features/tourhub/tournament-v2/sections/FullBoardSheet', () => ({ FullBoardSheet: () => null }));
vi.mock('@/features/tourhub/components/overview-v3/HybridHero', () => ({
  HybridHero: (props: { slide: HeroSlide }) => { f.heroSlides.push(props.slide.tournament.id); return <div data-testid="hybrid-hero" data-slide-id={props.slide.tournament.id} />; },
}));
vi.mock('@/features/tourhub/components/overview-v3/HybridHeroBands/HeroBoardBand', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/features/tourhub/components/overview-v3/HybridHeroBands/HeroBoardBand')>();
  return { ...actual, HeroBoardSection: () => null };
});
vi.mock('@/features/tourhub/components/overview-v3/useOverviewChampion', () => ({ OverviewChampionBlock: () => null }));

import { OverviewHero } from '@/features/tourhub/components/overview-v3/OverviewHero';
import { OVERVIEW_TOUR_ORDER } from '@/features/tourhub/_shared/tourOrder';

const DAY = 86_400_000;
const iso = (offsetDays: number) => new Date(Date.now() + offsetDays * DAY).toISOString().slice(0, 10);

const slide = (id: string, tourSlug: string, type: HeroSlide['type'], name = `Event ${id}`): HeroSlide => ({
  type,
  tournament: {
    id,
    name,
    tourSlug,
    status: type === 'live' ? 'inprogress' : type === 'completed' ? 'closed' : 'scheduled',
    startDate: type === 'upcoming' ? iso(10) : iso(-1),
    endDate: type === 'upcoming' ? iso(13) : type === 'completed' ? iso(-1) : iso(2),
    eventType: 'stroke',
  } as HeroSlide['tournament'],
});

const mountHero = () => render(
  <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
    <MemoryRouter>
      <OverviewHero />
    </MemoryRouter>
  </QueryClientProvider>,
);

const chipRow = () => screen.getByRole('group', { name: 'Tour' });
const chips = () => Array.from(chipRow().querySelectorAll<HTMLElement>('button'));
const selectedChip = () => chips().find((c) => c.getAttribute('aria-pressed') === 'true');

beforeEach(() => {
  f.slides = [];
  f.heroSlides = [];
  f.selection.selectedTourSlug = 'all';
  f.selection.selectedTournamentId = null;
  f.selection.selectionNonce = 0;
  f.selection.setViewingTourSlug = vi.fn();
  f.selection.setViewingTournamentId = vi.fn();
  f.selection.setViewingIsLive = vi.fn();
});
afterEach(cleanup);

describe('overview tour chip row', () => {
  it('exports the overview order as PGA, LPGA, DP World, Champions, Korn Ferry — not TOUR_PRIORITY', () => {
    expect(OVERVIEW_TOUR_ORDER).toEqual(['pga', 'lpga', 'euro', 'champ', 'pgad']);
  });

  it('renders one chip per slide in OVERVIEW_TOUR_ORDER, with no chip for a tour without a slide', () => {
    // Deliberately scrambled hook output: the overview reorders it.
    f.slides = [
      slide('pgad-1', 'pgad', 'upcoming'),
      slide('pga-1', 'pga', 'live'),
      slide('champ-1', 'champ', 'completed'),
      slide('lpga-1', 'lpga', 'upcoming'),
    ];
    mountHero();
    expect(chips().map((c) => c.textContent)).toEqual(['PGA', 'LPGA', 'Champions', 'Korn Ferry']);
    // euro (DP World) has no slide → no chip.
    expect(chips().some((c) => c.textContent === 'DP World')).toBe(false);
  });

  it('labels a same-tour pair "{TOUR} · {token}", live first then by start date', () => {
    f.slides = [
      slide('pga-up', 'pga', 'upcoming', 'The Bermuda Championship'),
      slide('pga-live', 'pga', 'live', 'World Wide Technology Championship'),
    ];
    mountHero();
    expect(chips().map((c) => c.textContent)).toEqual(['PGA · World', 'PGA · Bermuda']);
  });

  it('tapping a chip makes that slide active and reports the viewing tour, same as a swipe', async () => {
    f.slides = [slide('pga-1', 'pga', 'live'), slide('lpga-1', 'lpga', 'live')];
    mountHero();
    expect(selectedChip()?.textContent).toBe('PGA');
    fireEvent.click(chips()[1]);
    expect(selectedChip()?.textContent).toBe('LPGA');
    await vi.waitFor(() => expect(f.selection.setViewingTourSlug).toHaveBeenCalledWith('lpga'), { timeout: 1000 });
    await vi.waitFor(() => expect(screen.getByTestId('hybrid-hero').getAttribute('data-slide-id')).toBe('lpga-1'), { timeout: 1000 });
  });

  it('tapping the selected chip does nothing', () => {
    f.slides = [slide('pga-1', 'pga', 'live'), slide('lpga-1', 'lpga', 'live')];
    mountHero();
    const before = f.heroSlides.length;
    fireEvent.click(chips()[0]);
    expect(selectedChip()?.textContent).toBe('PGA');
    expect(f.heroSlides.length).toBe(before);
  });

  it('a swipe and an island selection both move the selected chip', async () => {
    f.slides = [slide('pga-1', 'pga', 'live'), slide('lpga-1', 'lpga', 'live'), slide('euro-1', 'euro', 'upcoming')];
    const v = mountHero();
    const frame = v.container.querySelector('[data-overview-hero-frame]') as HTMLElement;
    fireEvent.touchStart(frame, { touches: [{ clientX: 300 }] });
    fireEvent.touchMove(frame, { touches: [{ clientX: 100 }] });
    fireEvent.touchEnd(frame);
    expect(selectedChip()?.textContent).toBe('LPGA');
    // Island jump: the picker selects DP World and bumps the nonce.
    f.selection.selectedTourSlug = 'euro';
    f.selection.selectionNonce = 1;
    v.rerender(
      <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
        <MemoryRouter>
          <OverviewHero />
        </MemoryRouter>
      </QueryClientProvider>,
    );
    await vi.waitFor(() => expect(selectedChip()?.textContent).toBe('DP World'), { timeout: 1000 });
  });

  it('drops LIV, the pseudo-major and other unlisted tours from both the chips and the carousel', () => {
    f.slides = [
      slide('liv-1', 'liv', 'live'),
      slide('major-1', 'major', 'live', 'The Open Championship'),
      slide('pga-1', 'pga', 'live'),
    ];
    mountHero();
    expect(chips().map((c) => c.textContent)).toEqual(['PGA']);
    expect(f.heroSlides).toContain('pga-1');
    expect(f.heroSlides).not.toContain('liv-1');
    expect(f.heroSlides).not.toContain('major-1');
  });

  it('uses the canonical RailChips with toggle semantics — no new chip styles', () => {
    f.slides = [slide('pga-1', 'pga', 'live'), slide('lpga-1', 'lpga', 'live')];
    mountHero();
    const row = chipRow();
    expect(row.className).toContain('hide-scrollbar');
    expect(row.className).toContain('overview-tour-chips');
    chips().forEach((chip) => expect(chip.getAttribute('aria-pressed')).not.toBeNull());
    const source = readFileSync('src/features/tourhub/components/overview-v3/OverviewHero.tsx', 'utf8');
    expect(source).toContain("from '@/components/ui/RailChips'");
    expect(source).not.toContain('railChipStyle(');
  });
});

describe('"Full board ›" is gone from the hero kicker', () => {
  it('PhotoBand and HybridHero carry no onFullBoard prop or link', () => {
    const photo = readFileSync('src/features/tourhub/components/overview-v3/HybridHeroBands/PhotoBand.tsx', 'utf8');
    expect(photo).not.toContain('onFullBoard');
    expect(photo).not.toContain('data-overview-full-board');
    const hybrid = readFileSync('src/features/tourhub/components/overview-v3/HybridHero.tsx', 'utf8');
    expect(hybrid).not.toContain('onFullBoard');
    expect(hybrid).not.toContain('FullBoardSheet');
  });
});

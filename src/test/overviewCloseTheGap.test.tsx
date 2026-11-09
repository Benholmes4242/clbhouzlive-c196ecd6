/* URGENT_FIX close-the-gap — frame floor, block order and fallback slides.
   Structure only; no translated words. */
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { HeroSlide } from '@/features/tourhub/hooks/useHeroCarouselData';

const f = vi.hoisted(() => ({
  slides: [] as HeroSlide[],
  rows: { future: [] as unknown[], past: [] as unknown[], players: [] as unknown[] },
  calls: [] as string[],
}));

vi.mock('react-i18next', () => ({ initReactI18next: { type: '3rdParty', init: () => {} }, useTranslation: () => ({ t: (_k: string, o?: { defaultValue?: string }) => o?.defaultValue ?? '' }) }));
vi.mock('@/integrations/supabase/client', () => {
  const builder = (table: string) => {
    let kind = table;
    const q: Record<string, unknown> = {};
    const chain = () => q;
    Object.assign(q, {
      select: chain, eq: chain, gte: chain, lte: chain, order: chain, limit: chain,
      in: (col: string, vals: string[]) => { if (col === 'status') kind = vals.includes('closed') ? 'past' : 'future'; return q; },
      then: (res: (v: unknown) => void) => {
        f.calls.push(kind);
        res({ data: kind === 'future' ? f.rows.future : kind === 'past' ? f.rows.past : f.rows.players, error: null });
      },
    });
    return q;
  };
  return { supabase: { from: (t: string) => builder(t) } };
});
vi.mock('@/features/tourhub/hooks/useHeroCarouselData', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/features/tourhub/hooks/useHeroCarouselData')>();
  return { ...actual, useHeroCarouselData: () => ({ data: f.slides, isLoading: false }) };
});
vi.mock('@/features/tourhub/components/overview-v3/useOverviewFallbackSlides', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/features/tourhub/components/overview-v3/useOverviewFallbackSlides')>();
  return { ...actual, useOverviewFallbackSlides: () => ({ data: [], isLoading: false }) };
});
vi.mock('@/features/tourhub/hooks/useTourHubData', () => ({ useTourLeaderboard: () => ({ data: [] }) }));
vi.mock('@/features/tourhub/context/TourSelectionContext', () => ({ useTourSelection: () => ({ selectedTourSlug: 'all', selectedTournamentId: null, selectionNonce: 0, setViewingTourSlug: vi.fn(), setViewingTournamentId: vi.fn(), setViewingIsLive: vi.fn() }) }));
vi.mock('@/features/tourhub/hooks/useLeaderboardRealtime', () => ({ useLeaderboardRealtime: () => {} }));
vi.mock('@/features/tourhub/components/overview-v3/useHeroFullBoard', () => ({ useHeroFullBoard: () => ({ open: false, onOpen: vi.fn(), onClose: vi.fn(), meta: null }) }));
vi.mock('@/features/tourhub/tournament-v2/sections/FullBoardSheet', () => ({ FullBoardSheet: () => null }));
vi.mock('@/features/tourhub/components/overview-v3/HybridHero', () => ({ HybridHero: () => <div data-order="band" /> }));
vi.mock('@/features/tourhub/components/overview-v3/HybridHeroBands/HeroBoardBand', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/features/tourhub/components/overview-v3/HybridHeroBands/HeroBoardBand')>();
  return { ...actual, HeroBoardSection: () => <div data-order="board" /> };
});
vi.mock('@/features/tourhub/components/overview-v3/useOverviewChampion', () => ({
  OverviewChampionBlock: ({ slide }: { slide: HeroSlide }) => (slide.type === 'completed' ? <div data-overview-champion data-order="champion" /> : null),
}));

import { OverviewHero } from '@/features/tourhub/components/overview-v3/OverviewHero';
import { fetchOverviewFallbackSlides } from '@/features/tourhub/components/overview-v3/useOverviewFallbackSlides';

const DAY = 86_400_000;
const iso = (d: number) => new Date(Date.now() + d * DAY).toISOString().slice(0, 10);
const slide = (id: string, tourSlug: string, type: HeroSlide['type']): HeroSlide => ({
  type,
  tournament: {
    id, name: `Event ${id}`, tourSlug, eventType: 'stroke',
    status: type === 'live' ? 'inprogress' : type === 'completed' ? 'closed' : 'scheduled',
    startDate: type === 'upcoming' ? iso(10) : iso(-3),
    endDate: type === 'upcoming' ? iso(13) : type === 'completed' ? iso(0) : iso(2),
    winnerId: type === 'completed' ? 'w' : null, winnerName: type === 'completed' ? 'A Winner' : null,
  } as HeroSlide['tournament'],
});
const row = (id: string, tour: string, extra: Record<string, unknown> = {}) => ({
  id, name: `Row ${id}`, status: 'scheduled', event_type: 'stroke', start_date: '2027-01-15', end_date: '2027-01-18',
  winner_id: null, season: { id: 's', tour_id: 't', tour_name: tour, year: 2027 }, ...extra,
});

const mount = () => render(
  <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
    <MemoryRouter><OverviewHero /></MemoryRouter>
  </QueryClientProvider>,
);
const order = (c: HTMLElement) => Array.from(c.querySelectorAll('[data-order], [data-overview-chip-row]')).map((n) => n.getAttribute('data-order') ?? 'chips');
const frame = (c: HTMLElement) => c.querySelector('[data-overview-hero-frame]') as HTMLElement;

beforeEach(() => { f.slides = []; f.rows = { future: [], past: [], players: [] }; f.calls = []; });
afterEach(cleanup);

describe('no floor above the band', () => {
  it('finished frame has no min-height: its height is the band height', () => {
    f.slides = [slide('c', 'pga', 'completed')];
    const { container } = mount();
    expect(frame(container).style.minHeight).toBe('');
    expect(frame(container).style.height).toBe('auto');
  });
  it('upcoming frame likewise has no floor', () => {
    f.slides = [slide('u', 'pga', 'upcoming')];
    const { container } = mount();
    expect(frame(container).style.minHeight).toBe('');
  });
});

describe('block order', () => {
  it('finished: band → champion block → chip row → board', () => {
    f.slides = [slide('c', 'pga', 'completed')];
    const { container } = mount();
    expect(order(container)).toEqual(['band', 'champion', 'chips', 'board']);
  });
  it('live and upcoming: band → chip row → board, no champion block', () => {
    f.slides = [slide('l', 'pga', 'live')];
    const live = mount();
    expect(order(live.container)).toEqual(['band', 'chips', 'board']);
    cleanup();
    f.slides = [slide('u', 'pga', 'upcoming')];
    const up = mount();
    expect(order(up.container)).toEqual(['band', 'chips', 'board']);
  });
});

describe('fetchOverviewFallbackSlides', () => {
  it('supplies Korn Ferry its next scheduled event at any distance, as an upcoming slide', async () => {
    f.rows.future = [row('lpga-n', 'LPGA'), row('kf-next', 'PGAD'), row('kf-later', 'PGAD', { start_date: '2027-02-01' })];
    const slides = await fetchOverviewFallbackSlides(['pgad'], '2026-11-09');
    expect(slides).toHaveLength(1);
    expect(slides[0].type).toBe('upcoming');
    expect(slides[0].tournament.id).toBe('kf-next');
    expect(slides[0].tournament.tourSlug).toBe('pgad');
    expect(f.calls).toEqual(['future']);
  });
  it('with no future event, supplies the last completed event with its authoritative winner', async () => {
    f.rows.past = [row('kf-last', 'PGAD', { status: 'closed', winner_id: 'sr-w' })];
    f.rows.players = [{ sr_id: 'sr-w', first_name: 'Ann', last_name: 'Bee', photo_url: null, pga_tour_id: null, headshot_override: null }];
    const slides = await fetchOverviewFallbackSlides(['pgad'], '2026-11-09');
    expect(slides.map((s) => [s.type, s.tournament.id, s.tournament.winnerName])).toEqual([['completed', 'kf-last', 'Ann Bee']]);
  });
  it('a tour with neither future nor past event gets no slide; nothing missing reads nothing', async () => {
    expect(await fetchOverviewFallbackSlides(['pgad'], '2026-11-09')).toEqual([]);
    f.calls = [];
    expect(await fetchOverviewFallbackSlides([], '2026-11-09')).toEqual([]);
    expect(f.calls).toEqual([]);
  });
});

describe('useHeroCarouselData is untouched', () => {
  it('the carousel hook does not import or merge the fallback', async () => {
    const { readFileSync } = await import('node:fs');
    const src = readFileSync('src/features/tourhub/hooks/useHeroCarouselData.ts', 'utf8');
    expect(src).not.toContain('Fallback');
    expect(src).toContain('return [...cappedLive, ...cappedCompleted, ...cappedUpcoming];');
  });
});

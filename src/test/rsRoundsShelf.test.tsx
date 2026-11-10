import React from 'react';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createInstance } from 'i18next';
import { I18nextProvider } from 'react-i18next';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { readFileSync } from 'node:fs';
import courses from '../../public/locales/en/courses.json';

/* ---------------------------------------------------------------- mocks */

const f = vi.hoisted(() => ({
  pools: { circle: [] as unknown[], everyone: [] as unknown[] },
  rpcCalls: [] as Array<Record<string, unknown>>,
  rpcImpl: null as null | ((name: string, args: Record<string, unknown>) => Promise<unknown>),
  shapes: null as unknown,
  track: vi.fn(),
  warn: vi.fn(),
}));

vi.mock('@/components/explore-tab-new/courseled/hooks/useRoundHoleShapes', () => ({ useRoundHoleShapes: () => f.shapes }));
vi.mock('@/components/ui/SquircleAvatar', () => ({ SquircleAvatar: () => null }));
vi.mock('@/utils/analyticsEvents', () => ({ analyticsEvents: { track: f.track } }));

/* WatchFeed's own reads, so the feed renders with no network. */
vi.mock('@/features/explore-magazine/watch/useWatchVideos', () => ({
  useWatchVideos: () => ({ data: { pages: [[]] }, isFetched: true, isError: false, hasNextPage: false, isFetchingNextPage: false, refetch: vi.fn(), fetchNextPage: vi.fn() }),
}));
vi.mock('@/features/explore-magazine/watch/useWatchClips', () => ({
  useWatchClips: () => ({ data: { pages: [[]] }, isFetched: true, isError: false, hasNextPage: false, isFetchingNextPage: false, refetch: vi.fn(), fetchNextPage: vi.fn() }),
}));
vi.mock('@/features/explore-magazine/watch/useWatchSignals', () => ({ useWatchProgress: () => ({ data: new Map() }) }));
/* WS1 — the Creators row and the lead read their own RPCs; keep them off the
   network here (no rows, so neither block renders). */
vi.mock('@/features/explore-magazine/watch/useFeaturedCreators', () => ({
  useFeaturedCreators: () => ({ data: [], isFetched: true, isError: false }),
}));
vi.mock('@/features/explore-magazine/watch/useWatchLead', () => ({
  useWatchLead: () => ({ data: null, isFetched: true, isError: false }),
}));
/* WS2 — the course and region shelves read their own RPCs; empty here. */
vi.mock('@/features/explore-magazine/watch/useWatchMiddle', () => ({
  useCourseVideos: () => ({ data: [], isLoading: false, isError: false }),
  useWatchRegions: () => ({ data: [], isLoading: false, isError: false }),
  useRegionCourses: () => ({ data: [], isLoading: false, isError: false }),
  useGridVideos: () => ({ data: undefined, isLoading: false, isError: false, hasNextPage: false, fetchNextPage: () => {} }),
}));
vi.mock('@/features/explore-magazine/watch/useWatchBottom', () => ({
  useWatchSpotlights: () => ({ data: [], isError: false }),
  useCreatorVideos: () => ({ data: [] }),
  useTop100Videos: () => ({ data: [], isError: false }),
}));
vi.mock('@/components/explore-tab-new/courseled/hooks/useMomentsOfTheWeek', () => ({
  useMomentsOfTheWeek: () => ({ data: [], isFetched: true, isError: false, refetch: vi.fn() }),
}));
vi.mock('@/hooks/gam/useUserAnalyticsCourses', () => ({ useUserAnalyticsCourses: () => ({ data: [] }) }));
vi.mock('@/context/ActiveActorContext', () => ({ useActiveActor: () => ({ activeActor: null }) }));
vi.mock('@/components/clubhouse/hooks/useClubhouseLikes', () => ({
  useClubhouseLikes: () => ({ handleLike: vi.fn(), getActiveLikeState: () => ({ isLiked: false, count: 0 }) }),
}));

/* RoundsPage / AmateurPage dependencies. */
vi.mock('@/features/explore-magazine/ScoresLeaderboardsPage', () => ({
  ScoresLeaderboardsPage: (p: { userId?: string; sessionKnown?: boolean }) => (
    <div data-testid="scores-page" data-user={p.userId ?? ''} data-session={String(p.sessionKnown)} />
  ),
}));
vi.mock('@/features/amateur/useAmateurBoardState', () => ({ useAmateurBoardState: () => ({ board: 'recent' }) }));
vi.mock('@/hooks/useSupabaseSession', () => ({ useSupabaseSession: () => ({ user: { id: 'me' }, loading: false }) }));
vi.mock('@/components/explore-tab-new/useScorecardOpener', () => ({
  useScorecardOpener: () => ({ target: null, openByScore: vi.fn(), openProfile: vi.fn(), close: vi.fn() }),
}));
vi.mock('@/components/profile/handicap/whs/sections/round-detail/RoundDetailSheet', () => ({ RoundDetailSheet: () => null }));
vi.mock('@/components/common/ScrollToTopGlass', () => ({ default: () => null }));
vi.mock('@/features/explore-magazine/UnknownConnectionFallback', () => ({ UnknownConnectionFallback: () => null }));
vi.mock('@/features/explore-magazine/ExploreMagazine', () => ({ ExploreMagazine: () => <div data-testid="explore-magazine" /> }));
vi.mock('@/features/guest/useGuestSurfaceGate', () => ({ useGuestScrollGate: () => {} }));
vi.mock('@/hooks/useDiscoverLastSeen', () => ({ useDiscoverLastSeen: () => ({ markSeen: vi.fn() }), useMarkDiscoverSeenOnExit: () => {} }));

import { supabase } from '@/integrations/supabase/client';
import { RoundsThisWeekShelf } from '@/features/explore-magazine/watch/RoundsThisWeekShelf';
import { WatchFeed } from '@/features/explore-magazine/watch/WatchFeed';
import RoundsPage from '@/pages/RoundsPage';
import { resolveChrome } from '@/features/chrome-v2/registry';
import AmateurPage from '@/pages/AmateurPage';
import {
  recentSentenceParts,
  roundToPar,
  toParLabel,
} from '@/features/explore-magazine/watch/roundsShelfRules';
import * as shelfRules from '@/features/explore-magazine/watch/roundsShelfRules';
import { RoundTileMarks, tileMarkCells, isNineHoleShape } from '@/features/explore-magazine/watch/RoundTileMarks';
import { EXPLORE_VIEWS, readExploreView } from '@/features/explore-magazine/exploreViewMemory';
import type { StandoutRound } from '@/components/explore-tab-new/courseled/hooks/useStandoutRounds';

/* ------------------------------------------------------------- fixtures */

const i18n = createInstance();
void i18n.init({ lng: 'en', initAsync: false, interpolation: { escapeValue: false }, resources: { en: { courses } } });

function mount(node: React.ReactNode, initial = '/') {
  return render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <MemoryRouter initialEntries={[initial]}>
      <I18nextProvider i18n={i18n}>
        <Routes>
          <Route path="*" element={node} />
          <Route path="/rounds" element={<div data-testid="rounds-route" />} />
        </Routes>
      </I18nextProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

const round = (id: string, over: Partial<StandoutRound> = {}): StandoutRound => ({
  pos: 1,
  user_id: `u-${id}`,
  display_name: `Player ${id}`,
  profile_photo_url: null,
  whs_score_id: `s-${id}`,
  play_date: '2026-10-31',
  course_id: null,
  course_name: 'Royal County Down Golf Club (Championship)',
  gross_score: 81,
  course_par: 71,
  net_score: 70,
  course_handicap: null,
  is_competition: false,
  prior_n: 5,
  avg_topar: 3,
  best_topar: -1,
  last_better: null,
  delta: -2,
  ...over,
});

const eighteenHoles = Array.from({ length: 18 }, (_, i) => ({
  holeNo: i + 1,
  par: 4,
  strokes: i === 0 ? 3 : i === 1 ? 6 : i === 2 ? 2 : i === 3 ? 5 : 4,
  sheetStrokes: 4,
}));

/** The default RPC behaviour: page the scope's pool, newest first. */
const pagedRpc = async (name: string, args: Record<string, unknown>) => {
  f.rpcCalls.push({ name, ...args });
  if (name !== 'get_recent_rounds') return { data: null, error: null };
  const pool = f.pools[(args.p_scope as 'circle' | 'everyone') ?? 'circle'];
  const offset = (args.p_offset as number) ?? 0;
  const limit = (args.p_limit as number) ?? 10;
  return { data: pool.slice(offset, offset + limit).map((r) => ({ ...(r as Record<string, unknown>), total_count: pool.length })), error: null };
};

let rpcSpy: ReturnType<typeof vi.spyOn> | null = null;

beforeEach(() => {
  vi.clearAllMocks();
  sessionStorage.clear();
  f.pools = { circle: [round('a'), round('b'), round('c'), round('d')], everyone: [round('w'), round('x')] };
  f.rpcCalls = [];
  f.rpcImpl = null;
  f.shapes = new Map([['s-a', { coursePar: 71, series: [], beads: [], played: 18, birdies: 2, holes: eighteenHoles }]]);
  rpcSpy = vi.spyOn(supabase, 'rpc').mockImplementation(((name: unknown, args: unknown) =>
    (f.rpcImpl ?? pagedRpc)(name as string, (args ?? {}) as Record<string, unknown>)) as never);
  vi.spyOn(console, 'warn').mockImplementation(f.warn);
});

afterEach(() => {
  cleanup();
  rpcSpy?.mockRestore();
  rpcSpy = null;
});

const shelf = (props: Partial<Parameters<typeof RoundsThisWeekShelf>[0]> = {}) =>
  mount(<RoundsThisWeekShelf userId="me" {...props} />);

const roundCards = () => Array.from(document.querySelectorAll('[data-rounds-shelf-card="round"]'));

/** Installs an IntersectionObserver whose callbacks the test can fire. */
function captureObservers() {
  const callbacks: IntersectionObserverCallback[] = [];
  const original = window.IntersectionObserver;
  window.IntersectionObserver = class {
    constructor(cb: IntersectionObserverCallback) { callbacks.push(cb); }
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof IntersectionObserver;
  return {
    fireAll: () => act(() => {
      for (const cb of callbacks) cb([{ isIntersecting: true, intersectionRatio: 1 } as IntersectionObserverEntry], {} as IntersectionObserver);
    }),
    restore: () => { window.IntersectionObserver = original; },
  };
}

/* ---------------------------------------------------------------- rules */

describe('RR shelf rules', () => {
  it('computes net to par and its label', () => {
    expect(roundToPar(round('a'))).toBe(-1);
    expect(roundToPar(round('a', { course_par: null }))).toBeNull();
    expect(toParLabel(-1)).toBe('−1');
    expect(toParLabel(0)).toBe('E');
    expect(toParLabel(2)).toBe('+2');
    expect(toParLabel(null)).toBeNull();
  });

  it('no longer exports the coloured dot strip (BUILD Round scores §1)', () => {
    expect('stripColor' in shelfRules).toBe(false);
    expect('STRIP_COLORS' in shelfRules).toBe(false);
  });

  it('tile marks: eighteen holes draw two rows of nine, nine holes one row', () => {
    const shape = { coursePar: 71, series: [], beads: [], played: 18, birdies: 2, holes: eighteenHoles };
    expect(isNineHoleShape(shape as never)).toBe(false);
    const cells = tileMarkCells(shape as never);
    expect(cells).toHaveLength(18);
    expect(cells[0]).toEqual({ strokes: 3, par: 4 });
    const { container } = mount(<RoundTileMarks shape={shape as never} />);
    const rows = container.querySelectorAll('[data-hole-marks]');
    expect(rows).toHaveLength(2);
    expect(rows[0].querySelectorAll('[data-hole-mark]')).toHaveLength(9);
    expect(rows[1].querySelectorAll('[data-hole-mark]')).toHaveLength(9);
    expect(container.querySelector('[data-round-tile-marks]')).toHaveAttribute('data-round-tile-marks', 'eighteen');
  });

  it('tile marks: a nine-hole round draws one row of nine', () => {
    const nine = { coursePar: 36, series: [], beads: [], played: 9, birdies: 1, holes: eighteenHoles.slice(0, 9) };
    expect(isNineHoleShape(nine as never)).toBe(true);
    const { container } = mount(<RoundTileMarks shape={nine as never} />);
    const rows = container.querySelectorAll('[data-hole-marks]');
    expect(rows).toHaveLength(1);
    expect(rows[0].querySelectorAll('[data-hole-mark]')).toHaveLength(9);
    expect(container.querySelector('[data-round-tile-marks]')).toHaveAttribute('data-round-tile-marks', 'nine');
  });

  it('tile marks: unplayed holes keep the empty dot and the surface is the tile background', () => {
    const sparse = { coursePar: 71, series: [], beads: [], played: 2, birdies: 0, holes: eighteenHoles.slice(0, 2) };
    const { container } = mount(<RoundTileMarks shape={sparse as never} />);
    const marks = container.querySelectorAll('[data-hole-mark]');
    expect(marks).toHaveLength(9);
    expect(marks[2]).toHaveAttribute('data-grade', 'empty');
    expect((container.querySelector('[data-hole-marks]') as HTMLElement).style.getPropertyValue('--hm-surface')).toBe('#17171B');
  });
});

describe('RR the line under each card', () => {
  it('(1) no course, or no comparison figures with an out-of-range par: no line', () => {
    expect(recentSentenceParts(round('a', { course_name: null }))).toBeNull();
    expect(
      recentSentenceParts(round('a', { avg_topar: null, delta: null, prior_n: 0, course_par: null })),
    ).toBeNull();
    expect(
      recentSentenceParts(round('a', { avg_topar: null, delta: null, prior_n: 0, course_par: 27 })),
    ).toBeNull();
  });

  it('(2) prior_n 0 reads First round at the course', () => {
    const s = recentSentenceParts(round('a', { prior_n: 0, avg_topar: null, delta: null }));
    expect(s?.key).toBe('amateur.standout.firstRound');
    expect(s?.defaultValue).toBe('First round at {{course}}');
  });

  it('(3) nothing better on record reads Best ever', () => {
    const s = recentSentenceParts(round('a', { last_better: null }));
    expect(s?.key).toBe('amateur.standout.bestEver');
  });

  it('(4) better after sixty-plus days reads Best since the month', () => {
    const s = recentSentenceParts(round('a', { last_better: '2024-04-10', delta: -2 }), 'en');
    expect(s?.key).toBe('amateur.standout.bestSince');
    expect(s?.month).toBe('April 2024');
  });

  it('(5) the second and third recorded rounds read as ordinals', () => {
    const recent = { last_better: '2026-10-25', delta: 0 };
    const second = recentSentenceParts(round('a', { ...recent, prior_n: 1 }));
    expect(second?.key).toBe('amateur.standout.ordinalRound');
    expect(second?.ordinal).toBe('2nd');
    const third = recentSentenceParts(round('a', { ...recent, prior_n: 2 }));
    expect(third?.ordinal).toBe('3rd');
  });

  it('(6) a shot or more under average reads shots better than average', () => {
    const s = recentSentenceParts(round('a', { last_better: '2026-10-25', delta: -3 }));
    expect(s?.key).toBe('amateur.standout.betterAverage');
    expect(s?.n).toBe(3);
  });

  it('(7) a shot or more over average reads shots above average', () => {
    const s = recentSentenceParts(round('a', { last_better: '2026-10-25', delta: 2 }));
    expect(s?.key).toBe('amateur.standout.aboveAverage');
    expect(s?.n).toBe(2);
  });

  it('(8) within a shot of average reads Right on average', () => {
    const s = recentSentenceParts(round('a', { last_better: '2026-10-25', delta: 0 }));
    expect(s?.key).toBe('amateur.standout.rightOnAverage');
  });
});

/* ---------------------------------------------------------------- shelf */

describe('RR Recent rounds shelf', () => {
  it('renders newest first from get_recent_rounds, with the new heading and circle sub-line', async () => {
    shelf();
    expect(await screen.findByText('Recent rounds')).toBeInTheDocument();
    expect(screen.getByText('Your circle, last 14 days')).toBeInTheDocument();
    expect(roundCards()).toHaveLength(4);
    expect(roundCards()[0].textContent).toContain('Player a');
    expect(f.rpcCalls).toContainEqual({ name: 'get_recent_rounds', p_scope: 'circle', p_window: '14', p_limit: 10, p_offset: 0 });
  });

  it('loads the next page when the sentinel shows, with a skeleton, and stops at total_count', async () => {
    f.pools.circle = Array.from({ length: 12 }, (_, i) => round(`p${i}`));
    const io = captureObservers();
    let release: (() => void) | null = null;
    shelf();
    await waitFor(() => expect(roundCards()).toHaveLength(10));
    expect(document.querySelector('[data-rounds-shelf-end]')).toBeNull();
    /* Hold page two back so the end skeleton is observable. */
    f.rpcImpl = async (name, args) => {
      if (name === 'get_recent_rounds' && (args.p_offset as number) > 0) {
        await new Promise<void>((resolve) => { release = resolve; });
      }
      return pagedRpc(name, args);
    };
    io.fireAll();
    await waitFor(() => expect(document.querySelector('[data-rounds-shelf-skeleton]')).toBeInTheDocument());
    release!();
    await waitFor(() => expect(roundCards()).toHaveLength(12));
    expect(f.rpcCalls.filter((c) => c.name === 'get_recent_rounds').map((c) => c.p_offset)).toEqual([0, 10]);
    expect(document.querySelector('[data-rounds-shelf-skeleton]')).toBeNull();
    expect(document.querySelector('[data-rounds-shelf-end]')).toBeNull();
    io.restore();
  });

  it('ends on the final round without an end tile or Rounds navigation', async () => {
    f.pools.circle = [round('a'), round('b'), round('c')];
    shelf();
    await waitFor(() => expect(roundCards()).toHaveLength(3));
    expect(document.querySelector('[data-rounds-shelf-end]')).toBeNull();
    expect(screen.queryByText("That's the last 14 days")).toBeNull();
    expect(screen.queryByText('Leaderboards, feats and every round')).toBeNull();
    expect(screen.queryByTestId('rounds-route')).toBeNull();
    expect(f.track).not.toHaveBeenCalledWith('rounds_door_tapped', { from: 'end' });
  });

  it('the header has no Leaderboards pill or Rounds door', async () => {
    f.pools.circle = Array.from({ length: 12 }, (_, i) => round(`p${i}`));
    shelf();
    await screen.findByText('Recent rounds');
    expect(screen.queryByText('Leaderboards')).toBeNull();
    expect(document.querySelector('[data-rounds-shelf-door]')).toBeNull();
    expect(screen.queryByText('Leaderboards, feats and every round')).toBeNull();
    expect(screen.queryByText('All rounds')).toBeNull();
    expect(screen.queryByTestId('rounds-route')).toBeNull();
    expect(f.track).not.toHaveBeenCalledWith('rounds_door_tapped', { from: 'header' });
  });

  it('the rail snaps to the 16px inset, not the screen edge', async () => {
    shelf();
    await screen.findByText('Recent rounds');
    const rail = document.querySelector('[data-rounds-shelf-rail]') as HTMLElement;
    expect(rail.style.scrollPaddingInline).toBe('16px');
    expect(rail.style.padding).toBe('0px 16px');
  });

  it('falls back to everyone under two circle rounds and says so', async () => {
    f.pools.circle = [round('only')];
    shelf();
    expect(await screen.findByText('Everyone, last 14 days')).toBeInTheDocument();
    expect(await screen.findByText('Player w')).toBeInTheDocument();
    expect(f.rpcCalls).toContainEqual({ name: 'get_recent_rounds', p_scope: 'everyone', p_window: '14', p_limit: 10, p_offset: 0 });
  });

  it('hides the heading when there are no rounds', async () => {
    f.pools = { circle: [], everyone: [] };
    shelf();
    await waitFor(() => expect(document.querySelector('[data-rounds-shelf="empty"]')).toBeInTheDocument());
    expect(screen.queryByText('Recent rounds')).toBeNull();
  });

  it('hides the shelf quietly on error and logs', async () => {
    f.rpcImpl = async () => ({ data: null, error: new Error('boom') });
    shelf();
    await waitFor(() => expect(f.warn).toHaveBeenCalled());
    expect(screen.queryByText('Recent rounds')).toBeNull();
  });

  it('renders nothing for a signed-out visitor', () => {
    mount(<RoundsThisWeekShelf userId={undefined} />);
    expect(document.querySelector('[data-rounds-shelf]')).toBeNull();
    expect(f.rpcCalls).toHaveLength(0);
  });

  it('reserves the heading and two cards while loading, with no door bar', async () => {
    f.rpcImpl = () => new Promise(() => {});
    shelf();
    expect(document.querySelector('[data-rounds-shelf="loading"]')).toBeInTheDocument();
    expect(document.querySelector('[data-rounds-shelf-door]')).toBeNull();
    expect(screen.queryByText('Leaderboards, feats and every round')).toBeNull();
  });

  it('round card: the Standout tile — NET/GROSS foot with red under-par, COMP and date bottom right, marks and the full sentence', async () => {
    f.pools.circle = [round('a', { is_competition: true }), round('b')];
    shelf();
    await screen.findByText('Recent rounds');
    const card = document.querySelector('[data-rounds-shelf-card="round"]') as HTMLElement;
    expect(card.className).toContain('standout-card');
    /* EXPLORE TILES A: the 34px score and the "Net · gross" kicker are gone. */
    expect(card.textContent).not.toContain('Net · gross');
    expect(card.querySelector('[data-kind="net"]')).toHaveTextContent('NET70−1');
    expect(card.querySelector('[data-kind="net"] i')).toHaveAttribute('data-under', 'true');
    expect(card.querySelector('[data-kind="gross"]')).toHaveTextContent('GROSS81+10');
    const when = card.querySelector('.standout-when');
    expect(when).toHaveTextContent('Oct 31');
    expect(when?.querySelector('.standout-comp')).toHaveTextContent('COMP');
    const marks = card.querySelectorAll('[data-hole-mark]');
    expect(marks).toHaveLength(18);
    expect(marks[0]).toHaveAttribute('data-grade', 'birdie');
    expect(marks[1]).toHaveAttribute('data-grade', 'double');
    expect(marks[2]).toHaveAttribute('data-grade', 'eagle');
    expect(marks[3]).toHaveAttribute('data-grade', 'bogey');
    expect(marks[4]).toHaveAttribute('data-grade', 'par');
    expect(card.querySelectorAll('[data-hole-marks]')).toHaveLength(2);
    const story = card.querySelector('.standout-story');
    expect(story).toHaveTextContent('Best ever at Royal County Down Golf Club (Championship)');
  });

  it('round card: level par reads E in the NET figure and no marks render without shapes', async () => {
    f.pools.circle = [round('a', { net_score: 71 }), round('b')];
    f.shapes = null;
    shelf();
    await screen.findByText('Recent rounds');
    const card = document.querySelector('[data-rounds-shelf-card="round"]') as HTMLElement;
    expect(card.querySelector('[data-kind="net"]')).toHaveTextContent('NET71E');
    expect(card.querySelector('[data-kind="net"] i')).toHaveAttribute('data-under', 'false');
    expect(card.querySelectorAll('[data-hole-mark]')).toHaveLength(0);
  });

  it('taps open the right score id and the avatar opens the member', async () => {
    const onOpenRound = vi.fn();
    const onOpenMember = vi.fn();
    shelf({ onOpenRound, onOpenMember });
    await screen.findByText('Recent rounds');
    fireEvent.click(document.querySelector('[data-rounds-shelf-card="round"]') as HTMLElement);
    expect(onOpenRound).toHaveBeenCalledWith('s-a', 'u-a');
    expect(f.track).toHaveBeenCalledWith('rounds_shelf_card_tapped', { kind: 'round' });
    fireEvent.click(screen.getAllByRole('button', { name: 'Player a' })[0]);
    expect(onOpenMember).toHaveBeenCalledWith('u-a');
  });
});

/* ------------------------------------------------------- Watch placement */

describe('RS shelf placement on Watch', () => {
  /* WS1 — chips renamed: All → For you, Quick hits → Shorts. Same shelf rules. */
  it('shows on the For you chip for a signed-in member, after Quick hits, and not on other chips', async () => {
    mount(<WatchFeed userId="me" onDepart={() => {}} />);
    await waitFor(() => expect(document.querySelector('[data-rounds-shelf]')).toBeInTheDocument());
    fireEvent.click(screen.getByRole('tab', { name: 'Shorts' }));
    expect(document.querySelector('[data-rounds-shelf]')).toBeNull();
    fireEvent.click(screen.getByRole('tab', { name: 'For you' }));
    expect(document.querySelector('[data-rounds-shelf]')).toBeInTheDocument();
  });

  it('is absent for a signed-out visitor', () => {
    mount(<WatchFeed userId={undefined} onDepart={() => {}} />);
    expect(document.querySelector('[data-rounds-shelf]')).toBeNull();
  });
});

/* ------------------------------------------------------------- /rounds */

describe('RS /rounds page', () => {
  it('mounts the scores board with the viewer and fires rounds_page_viewed', () => {
    mount(<RoundsPage />);
    const page = screen.getByTestId('scores-page');
    expect(page).toHaveAttribute('data-user', 'me');
    expect(page).toHaveAttribute('data-session', 'true');
    expect(screen.getByText('Rounds')).toBeInTheDocument();
    expect(f.track).toHaveBeenCalledWith('rounds_page_viewed', {});
  });

  it('global back retains the /amateur fallback when there is no history', () => {
    expect(resolveChrome('/rounds', new URLSearchParams()).left).toEqual({
      kind: 'back', title: null, backTarget: 'history', backFallback: '/amateur',
    });
  });

  function RoundsMarker() {
    const { search } = useLocation();
    return <div data-testid="rounds-marker" data-search={search} />;
  }

  const renderAmateur = (entry: string) =>
    render(
      <QueryClientProvider client={new QueryClient()}>
        <MemoryRouter initialEntries={[entry]}>
          <I18nextProvider i18n={i18n}>
            <Routes>
              <Route path="/amateur" element={<><AmateurPage /><RoundsMarker /></>} />
              <Route path="/rounds" element={<RoundsMarker />} />
            </Routes>
          </I18nextProvider>
        </MemoryRouter>,
      </QueryClientProvider>,
    );

  it('/amateur?view=scores stays on Explore and strips only view', () => {
    renderAmateur('/amateur?view=scores&tab=x');
    expect(screen.getByTestId('rounds-marker')).toHaveAttribute('data-search', '?tab=x');
    expect(screen.getByTestId('explore-magazine')).toBeInTheDocument();
  });

  it('/amateur without view=scores still renders Explore', () => {
    renderAmateur('/amateur?view=watch');
    expect(screen.getByTestId('explore-magazine')).toBeInTheDocument();
  });
});

/* ------------------------------------------------- Explore switch removal */

describe('RS Explore opens on Watch', () => {
  it('EXPLORE_VIEWS cannot land on scores; a remembered scores falls to Watch', () => {
    expect(EXPLORE_VIEWS).not.toContain('scores');
    sessionStorage.setItem('amateur:view', 'scores');
    expect(readExploreView()).toBe('watch');
  });

  it('ExploreMagazine carries no Scores mount, board state or view switch', () => {
    const source = readFileSync('src/features/explore-magazine/ExploreMagazine.tsx', 'utf8');
    for (const gone of [
      'ScoresLeaderboardsPage',
      'useAmateurBoardState',
      'BoardFilterPanel',
      'changeView',
      'writeExploreView',
      'ScoresStandingSlot',
      'CircleShelf',
      'UnknownConnectionFallback',
      'boardRowPress',
      'scoresBoardActive',
    ]) {
      expect(source).not.toContain(gone);
    }
    expect(source).toContain('WatchFeed');
  });
});

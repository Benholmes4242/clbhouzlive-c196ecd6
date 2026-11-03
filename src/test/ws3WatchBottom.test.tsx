import React from 'react';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createInstance } from 'i18next';
import { I18nextProvider } from 'react-i18next';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import courses from '../../public/locales/en/courses.json';

/* ---------------------------------------------------------------- mocks */

const f = vi.hoisted(() => ({
  videos: { data: { pages: [[]] as unknown[][] }, isFetched: true, isError: false, hasNextPage: false, isFetchingNextPage: false, refetch: vi.fn(), fetchNextPage: vi.fn() },
  clips: { data: { pages: [[]] as unknown[][] }, isFetched: true, isError: false, hasNextPage: false, isFetchingNextPage: false, refetch: vi.fn(), fetchNextPage: vi.fn() },
  moments: [] as unknown[],
  spotlight: { data: null as unknown, isError: false },
  spotlightKeys: [] as string[],
  creatorVideos: { data: [] as unknown[] },
  top100: { data: [] as unknown[], isError: false },
  grid: { data: { pages: [[]] as unknown[][] }, isSuccess: true, hasNextPage: false, isFetchingNextPage: false, fetchNextPage: vi.fn() },
  gridCalls: [] as unknown[],
  toggle: vi.fn(),
  track: vi.fn(),
  openWithOrigin: vi.fn(),
  rpc: vi.fn(),
}));

vi.mock('@/features/explore-magazine/watch/useWatchVideos', () => ({ useWatchVideos: () => f.videos }));
vi.mock('@/features/explore-magazine/watch/useWatchClips', () => ({ useWatchClips: () => f.clips }));
vi.mock('@/features/explore-magazine/watch/useWatchSignals', () => ({ useWatchProgress: () => ({ data: new Map() }) }));
vi.mock('@/components/explore-tab-new/courseled/hooks/useMomentsOfTheWeek', () => ({
  useMomentsOfTheWeek: () => ({ data: f.moments, isFetched: true, isError: false, refetch: vi.fn() }),
}));
vi.mock('@/hooks/gam/useUserAnalyticsCourses', () => ({ useUserAnalyticsCourses: () => ({ data: [] }) }));
vi.mock('@/context/ActiveActorContext', () => ({ useActiveActor: () => ({ activeActor: null }) }));
vi.mock('@/components/clubhouse/hooks/useClubhouseLikes', () => ({
  useClubhouseLikes: () => ({ handleLike: vi.fn(), getActiveLikeState: () => ({ isLiked: false, count: 0 }) }),
}));
vi.mock('@/components/explore-tab-new/courseled/MomentTile', () => ({ MomentTile: () => <div /> }));
vi.mock('@/features/explore-magazine/watch/CreatorsRow', () => ({ CreatorsRow: () => null }));
vi.mock('@/features/explore-magazine/watch/WatchLead', () => ({ WatchLead: () => null }));
vi.mock('@/features/explore-magazine/watch/RoundsThisWeekShelf', () => ({ RoundsThisWeekShelf: () => null }));
vi.mock('@/features/explore-magazine/watch/RegionsShelf', () => ({ RegionsShelf: () => <div data-stub="regions" /> }));
vi.mock('@/features/explore-magazine/watch/useWatchMiddle', () => ({
  useCourseVideos: () => ({ data: [], isLoading: false, isError: false }),
  useWatchRegions: () => ({ data: [], isLoading: false, isError: false }),
  useRegionCourses: () => ({ data: [] }),
  useGridVideos: (_u: unknown, src: unknown) => { f.gridCalls.push(src); return f.grid; },
}));
vi.mock('@/features/explore-magazine/watch/useWatchBottom', () => ({
  useWatchSpotlights: (_u: unknown, key: string) => { f.spotlightKeys.push(key); return { ...f.spotlight, data: Array.isArray(f.spotlight.data) ? f.spotlight.data : f.spotlight.data ? [f.spotlight.data] : [] }; },
  useCreatorVideos: () => f.creatorVideos,
  useTop100Videos: () => f.top100,
}));
vi.mock('@/hooks/useToggleFollow', () => ({ useToggleFollow: () => ({ mutateAsync: f.toggle }) }));
vi.mock('@/components/ui/SquircleAvatar', () => ({ SquircleAvatar: () => <span data-stub="avatar" /> }));
vi.mock('@/hooks/useSupabaseSession', () => ({ useSupabaseSession: () => ({ user: { id: 'me' }, loading: false }) }));
vi.mock('@/lib/openWithOrigin', () => ({ openWithOrigin: f.openWithOrigin }));
vi.mock('@/components/explore-tab-new/courseled/mediaRailAutoplay', () => ({ registerRailVideo: () => () => {}, IN_VIEW_THRESHOLD: 0.6, MAX_PLAYING: 1 }));
vi.mock('@/components/explore-tab-new/courseled/tileHlsPlayer', () => ({ attachTileHls: () => ({ detach: vi.fn() }) }));
vi.mock('@/components/explore-tab-new/courseled/reviewVideoAutoplay', () => ({ autoplayBlocked: () => false, deliverVerdict: vi.fn() }));
vi.mock('@/hooks/usePrefersReducedMotion', () => ({ usePrefersReducedMotion: () => false }));
vi.mock('@/utils/analyticsEvents', () => ({ analyticsEvents: { track: f.track } }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { rpc: f.rpc } }));

import { WatchFeed } from '@/features/explore-magazine/watch/WatchFeed';
import { CreatorSpotlight, __resetSpotlight } from '@/features/explore-magazine/watch/CreatorSpotlight';
import { Top100FilmShelf } from '@/features/explore-magazine/watch/Top100FilmShelf';
import WatchGridPage from '@/pages/WatchGridPage';
import { rankPill, spotlightLine, spotlightRelative } from '@/features/explore-magazine/watch/watchBottom';

const real = await vi.importActual<typeof import('@/features/explore-magazine/watch/useWatchMiddle')>('@/features/explore-magazine/watch/useWatchMiddle');
const realBottom = await vi.importActual<typeof import('@/features/explore-magazine/watch/useWatchBottom')>('@/features/explore-magazine/watch/useWatchBottom');

const i18n = createInstance();
void i18n.init({ lng: 'en', initAsync: false, interpolation: { escapeValue: false }, resources: { en: { courses } } });

const longHub = (id: string, extra: Record<string, unknown> = {}) => ({ post_id: id, duration_seconds: 900, media_type: 'video', media_url: `https://x/${id}.mp4`, poster_url: null, creator_display_name: 'A', actor_id: 'a', post_created_at: '2026-10-01T00:00:00Z', ...extra });
const vid = (id: string, extra: Record<string, unknown> = {}) => ({
  post_id: id, actor_type: 'personal', actor_id: 'u1', display_name: 'Danny Holmes', handle: 'danny', avatar_url: null, is_verified: false,
  caption: '', media_url: `https://x/${id}.mp4`, hls_url: null, poster_url: `https://x/${id}.jpg`, stream_id: null, duration_seconds: 41,
  width: 1080, height: 1920, like_count: 0, created_at: new Date(Date.now() - 3 * 86_400_000).toISOString(),
  course_id: 'c1', course_name: 'Royal County Down Golf Club - Championship', region: 'Down',
  list_slug: 'gbi', list_label: 'GB&I', list_rank: 3, ...extra,
});
const spot = (extra: Record<string, unknown> = {}) => ({
  actor_type: 'personal', actor_id: 'p1', display_name: 'golfingwithellie', handle: 'ellie', avatar_url: null, is_verified: true,
  area: 'Surrey', videos: 38, courses_filmed: 12, handicap_index: 6.4, rounds: 142, courses_played: 31, ...extra,
});
const moment = (k: string) => ({ key: k, post: { userId: `m-${k}`, displayName: `Member ${k}` }, courseName: 'Somewhere' });

function LocationEcho() {
  const loc = useLocation();
  return <div data-testid="loc" data-path={loc.pathname} />;
}

function wrap(node: React.ReactNode) {
  return render(
    <MemoryRouter initialEntries={['/amateur']}>
      <I18nextProvider i18n={i18n}>
        <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
          <Routes><Route path="/amateur" element={<>{node}<LocationEcho /></>} /><Route path="*" element={<LocationEcho />} /></Routes>
        </QueryClientProvider>
      </I18nextProvider>
    </MemoryRouter>,
  );
}
const path = () => screen.getByTestId('loc').getAttribute('data-path');
const q = (sel: string) => document.querySelector(sel);
const before = (a: Element | null, b: Element | null) => !!a && !!b && !!(a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING);
const headingByText = (text: string) => Array.from(document.querySelectorAll('b, h2')).find((el) => el.textContent === text) ?? null;

beforeEach(() => {
  __resetSpotlight();
  f.videos.data = { pages: [[]] };
  f.clips.data = { pages: [[]] };
  f.moments = [];
  f.spotlight = { data: null, isError: false };
  f.spotlightKeys = [];
  f.creatorVideos = { data: [] };
  f.top100 = { data: [], isError: false };
  f.grid = { data: { pages: [[]] }, isSuccess: true, hasNextPage: false, isFetchingNextPage: false, fetchNextPage: vi.fn() };
  f.gridCalls = [];
  f.toggle.mockReset(); f.toggle.mockResolvedValue(undefined);
  f.track.mockReset(); f.openWithOrigin.mockReset(); f.rpc.mockReset();
});
afterEach(cleanup);

/* ---------------------------------------------------------------- order */

describe('WS3 order on For you', () => {
  function seed() {
    f.videos.data = { pages: [[longHub('l1'), longHub('l2'), longHub('l3'), longHub('l4')]] };
    f.moments = [moment('a')];
    f.spotlight = { data: spot(), isError: false };
    f.top100 = { data: [vid('t1'), vid('t2'), vid('t3')], isError: false };
  }

  it('By region → Creator to follow → Top 100 on film → Long form → the community rail', () => {
    seed();
    wrap(<WatchFeed userId="me" onDepart={() => {}} />);
    const regions = q('[data-stub="regions"]');
    const spotlight = q('[data-spotlight]');
    const top100 = q('[data-top100-shelf]');
    const longForm = headingByText('Long form');
    const community = q('[data-watch-rail="community"]');
    expect(before(regions, spotlight)).toBe(true);
    expect(before(spotlight, top100)).toBe(true);
    expect(before(top100, longForm)).toBe(true);
    expect(before(longForm, community)).toBe(true);
  });

  it('none of the three on the Shorts chip; Long form keeps its own view', () => {
    seed();
    wrap(<WatchFeed userId="me" onDepart={() => {}} initialFilter="quick" />);
    expect(q('[data-spotlight]')).toBeNull();
    expect(q('[data-top100-shelf]')).toBeNull();
    cleanup();
    seed();
    wrap(<WatchFeed userId="me" onDepart={() => {}} initialFilter="long" />);
    expect(q('[data-spotlight]')).toBeNull();
    expect(q('[data-top100-shelf]')).toBeNull();
    expect(document.querySelectorAll('[data-watch-card="long"]').length).toBe(4);
  });
});

/* ---------------------------------------------------------------- spotlight */

describe('WS3 Creator to follow', () => {
  it('hides, heading included, with no row and on error', () => {
    wrap(<CreatorSpotlight userId="me" visitKey="v1" />);
    expect(q('[data-spotlight]')).toBeNull();
    expect(headingByText('Creator to follow')).toBeNull();
    cleanup();
    f.spotlight = { data: spot(), isError: true };
    wrap(<CreatorSpotlight userId="me" visitKey="v1" />);
    expect(q('[data-spotlight]')).toBeNull();
  });

  it('one pick per mount: the visit key is stable across rerenders and chip switches', () => {
    f.spotlight = { data: spot(), isError: false };
    const client = new QueryClient();
    const tree = (n: number) => (
      <MemoryRouter initialEntries={['/amateur']}><I18nextProvider i18n={i18n}><QueryClientProvider client={client}>
        <WatchFeed key="feed" userId="me" onDepart={() => {}} initialFilter={n ? 'all' : 'all'} />
      </QueryClientProvider></I18nextProvider></MemoryRouter>
    );
    const view = render(tree(0));
    view.rerender(tree(1));
    const firstKeys = new Set(f.spotlightKeys);
    expect(firstKeys.size).toBe(1);
    cleanup();
    f.spotlightKeys = [];
    wrap(<WatchFeed userId="me" onDepart={() => {}} />);
    const second = new Set(f.spotlightKeys);
    expect(second.size).toBe(1);
    expect([...second][0]).not.toBe([...firstKeys][0]);
  });

  it('chip switch away and back keeps the same visit key', () => {
    f.spotlight = { data: spot(), isError: false };
    wrap(<WatchFeed userId="me" onDepart={() => {}} />);
    const chips = Array.from(document.querySelectorAll('button')).filter((b) => /^(For you|Shorts|Long form)$/.test(b.textContent ?? ''));
    const shorts = chips.find((b) => b.textContent === 'Shorts')!;
    const forYou = chips.find((b) => b.textContent === 'For you')!;
    fireEvent.click(shorts);
    fireEvent.click(forYou);
    expect(new Set(f.spotlightKeys).size).toBe(1);
  });

  it('WS6: figures are absent with rounds and a handicap', () => {
    f.spotlight = { data: spot(), isError: false };
    wrap(<CreatorSpotlight userId="me" visitKey="v" />);
    expect(q('[data-spotlight-figs]')).toBeNull();
  });
  it('WS6: figures are absent with rounds and no visible handicap', () => {
    f.spotlight = { data: spot({ handicap_index: null }), isError: false };
    wrap(<CreatorSpotlight userId="me" visitKey="v" />);
    expect(q('[data-spotlight-figs]')).toBeNull();
  });
  it('WS6: figures are absent without rounds regardless of courses filmed', () => {
    f.spotlight = { data: [spot({ rounds: 0, courses_filmed: 11 }), spot({ actor_id: 'p2', rounds: 0, courses_filmed: 0 })], isError: false };
    wrap(<CreatorSpotlight userId="me" visitKey="v" />);
    expect(document.querySelectorAll('[data-spotlight]')).toHaveLength(2);
    expect(q('[data-spotlight-figs]')).toBeNull();
  });
  it('WS6: video count alone until newest loaded video is available, singular video', () => {
    expect(spotlightLine({ videos: 38 })).toBe('38 videos');
    expect(spotlightLine({ videos: 24 })).toBe('24 videos');
    expect(spotlightLine({ videos: 1 })).toBe('1 video');
  });

  it('follow → Following → unfollow, the card stays', async () => {
    f.spotlight = { data: spot(), isError: false };
    wrap(<CreatorSpotlight userId="me" visitKey="v" />);
    const btn = () => q('[data-spotlight-follow]') as HTMLButtonElement;
    expect(btn().getAttribute('data-spotlight-follow')).toBe('off');
    await act(async () => { fireEvent.click(btn()); });
    expect(btn().getAttribute('data-spotlight-follow')).toBe('on');
    expect(f.toggle).toHaveBeenLastCalledWith(expect.objectContaining({ targetActorId: 'p1', isFollowing: false }));
    expect(f.track).toHaveBeenCalledWith('watch_spotlight_follow', { actor_type: 'personal', position: 1 });
    await act(async () => { fireEvent.click(btn()); });
    expect(btn().getAttribute('data-spotlight-follow')).toBe('off');
    expect(f.toggle).toHaveBeenLastCalledWith(expect.objectContaining({ isFollowing: true }));
    expect(q('[data-spotlight]')).not.toBeNull();
    expect(path()).toBe('/amateur');
  });

  it('videos row shows 1–3 tiles and opens the viewer with these videos', () => {
    f.spotlight = { data: spot(), isError: false };
    f.creatorVideos = { data: [vid('v1')] };
    wrap(<CreatorSpotlight userId="me" visitKey="v" />);
    expect(document.querySelectorAll('[data-spotlight-video]').length).toBe(1);
    cleanup();
    f.creatorVideos = { data: [vid('v1'), vid('v2'), vid('v3')] };
    wrap(<CreatorSpotlight userId="me" visitKey="v" />);
    expect(document.querySelectorAll('[data-spotlight-video]').length).toBe(3);
    fireEvent.click(q('[data-spotlight-video="v2"]')!);
    const call = f.openWithOrigin.mock.calls[0][0];
    expect(call.index).toBe(1);
    expect(call.posts.length).toBe(3);
    expect(f.track).toHaveBeenCalledWith('watch_spotlight_video_opened', { position: 1 });
  });

  it('head row routes: a person to their profile, a business to /business/{slug}', () => {
    f.spotlight = { data: spot(), isError: false };
    wrap(<CreatorSpotlight userId="me" visitKey="v" />);
    fireEvent.click(q('[data-spotlight-head]')!);
    expect(path()).not.toBe('/amateur');
    expect(path()).toContain('ellie');
    cleanup();
    f.spotlight = { data: spot({ actor_type: 'business', actor_id: 'b1', handle: 'classic-golf', display_name: 'Classic Golf' }), isError: false };
    wrap(<CreatorSpotlight userId="me" visitKey="v" />);
    expect(q('[data-spotlight-tile]')?.textContent).toBe('CG');
    fireEvent.click(q('[data-spotlight-head]')!);
    expect(path()).toBe('/business/classic-golf');
  });
});

/* ---------------------------------------------------------------- top 100 */

describe('WS3 Top 100 on film', () => {
  it('WS6: renders shared glass duration at top-right', () => {
    f.top100 = { data: [vid('t1'), vid('t2'), vid('t3')], isError: false };
    wrap(<Top100FilmShelf userId="me" />);
    const badge = Array.from(q('[data-top100-tile="t1"]')?.querySelectorAll('span') ?? []).find(el => el.style.right === '6px' && el.style.top === '6px');
    expect(q('[data-top100-tile="t1"] [data-duration]')).toBeNull();
    expect(badge).toBeTruthy();
  });
  it('hidden under three rows and on error', () => {
    f.top100 = { data: [vid('t1'), vid('t2')], isError: false };
    wrap(<Top100FilmShelf userId="me" />);
    expect(q('[data-top100-shelf]')).toBeNull();
    cleanup();
    f.top100 = { data: [vid('t1'), vid('t2'), vid('t3')], isError: true };
    wrap(<Top100FilmShelf userId="me" />);
    expect(q('[data-top100-shelf]')).toBeNull();
  });

  it('rank pill reads "{list_label} #{list_rank}"', () => {
    expect(rankPill({ list_label: 'GB&I', list_rank: 41 })).toBe('GB&I #41');
    f.top100 = { data: [vid('t1'), vid('t2', { list_rank: 12 }), vid('t3')], isError: false };
    wrap(<Top100FilmShelf userId="me" />);
    expect(q('[data-top100-tile="t2"] [data-top100-rank]')?.textContent).toBe('GB&I #12');
  });

  it('See all → /watch/top100; a tile opens the viewer with the list', () => {
    f.top100 = { data: [vid('t1'), vid('t2'), vid('t3')], isError: false };
    wrap(<Top100FilmShelf userId="me" />);
    fireEvent.click(q('[data-top100-tile="t3"]')!);
    expect(f.openWithOrigin.mock.calls[0][0].index).toBe(2);
    expect(f.track).toHaveBeenCalledWith('watch_top100_opened', { list_slug: 'gbi' });
    fireEvent.click(screen.getByText('See all'));
    expect(path()).toBe('/watch/top100');
  });

  it('/watch/top100: title, no sub, no chips, Top 100 source', () => {
    f.grid = { data: { pages: [[vid('g1'), vid('g2')]] }, isSuccess: true, hasNextPage: false, isFetchingNextPage: false, fetchNextPage: vi.fn() };
    wrap(<WatchGridPage kind="top100" />);
    expect(q('[data-grid-title]')?.textContent).toBe('Top 100 on film');
    expect(q('[data-grid-sub]')).toBeNull();
    expect(q('[data-grid-chips]')).toBeNull();
    expect(f.gridCalls.at(-1)).toEqual({ kind: 'top100' });
    expect(f.track).toHaveBeenCalledWith('watch_grid_viewed', { kind: 'top100' });
  });

  it('/watch/top100 pages 30 at a time on the last created_at', async () => {
    const page = Array.from({ length: 30 }, (_, i) => vid(`p${i}`, { created_at: `2026-10-${String(30 - (i % 28)).padStart(2, '0')}T00:00:00Z` }));
    f.rpc.mockResolvedValue({ data: page, error: null });
    await real.fetchGridPage({ kind: 'top100' });
    expect(f.rpc).toHaveBeenLastCalledWith('get_watch_top100_videos', { p_limit: 30 });
    await real.fetchGridPage({ kind: 'top100' }, '2026-10-03T00:00:00Z');
    expect(f.rpc).toHaveBeenLastCalledWith('get_watch_top100_videos', { p_limit: 30, p_before: '2026-10-03T00:00:00Z' });
  });
});

/* ---------------------------------------------------------------- long form */

describe('WS3 Long form', () => {
  it('heading "Long form" with the sub "Three minutes and over"', () => {
    f.videos.data = { pages: [[longHub('l1')]] };
    wrap(<WatchFeed userId="me" onDepart={() => {}} />);
    expect(headingByText('Long form')).not.toBeNull();
    expect(screen.getByText('Three minutes and over')).toBeTruthy();
  });

  it("Long form's See all selects the Long form chip", () => {
    const originalScrollTo = Element.prototype.scrollTo;
    const scrollTo = vi.fn();
    Element.prototype.scrollTo = scrollTo as never;
    try {
    f.videos.data = { pages: [[longHub('l1')]] };
    wrap(<WatchFeed userId="me" onDepart={() => {}} />);
    const chip = () => Array.from(document.querySelectorAll('button')).find((b) => b.textContent === 'Long form')!;
    expect(chip().getAttribute('aria-pressed') ?? chip().getAttribute('aria-selected')).not.toBe('true');
    const heading = headingByText('Long form')!.closest('div')!.parentElement!;
    fireEvent.click(Array.from(heading.querySelectorAll('button')).find((b) => b.textContent === 'See all')!);
    expect(scrollTo).toHaveBeenCalledWith(expect.objectContaining({ top: 0 }));
    expect(chip().getAttribute('aria-pressed') ?? chip().getAttribute('aria-selected')).toBe('true');
    expect(headingByText('Long form')!.closest('div')!.parentElement!.querySelector('button')).toBeNull();
    } finally {
      Element.prototype.scrollTo = originalScrollTo;
    }
  });

  it('course chip only when the row carries review_course_name, and it routes', () => {
    f.videos.data = { pages: [[longHub('l1', { review_course_id: 'rsg', review_course_name: "Royal St George's Golf Club" }), longHub('l2')]] };
    wrap(<WatchFeed userId="me" onDepart={() => {}} />);
    const chips = document.querySelectorAll('[data-watch-course-chip]');
    expect(chips.length).toBe(1);
    fireEvent.click(chips[0]);
    expect(path()).toBe('/courses/rsg');
    expect(f.openWithOrigin).not.toHaveBeenCalled();
  });
});

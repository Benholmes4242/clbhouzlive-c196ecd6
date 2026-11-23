/* Brief 14: Explore shelf heads move to the canonical eyebrow + 21px title. Harness copied from ws3WatchBottom.test.tsx. */
import React from 'react';
import { readFileSync } from 'node:fs';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createInstance } from 'i18next';
import { I18nextProvider } from 'react-i18next';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import courses from '../../src/locales/en/courses.json';

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
vi.mock('@/features/find-people/useRecentActivity', () => ({ useRecentActivity: () => new Map() }));
vi.mock('@/components/ui/SquircleAvatar', async (orig) => ({ ...(await orig<typeof import('@/components/ui/SquircleAvatar')>()), SquircleAvatar: () => <span data-stub="avatar" /> }));
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
const headingByText = (text: string) => Array.from(document.querySelectorAll('b, h2, [data-shelf-eyebrow]')).find((el) => el.textContent === text) ?? null;

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


import { ShelfHeading } from '@/features/explore-magazine/watch/CourseVideosShelf';

const W = courses.amateur.watch;
const head = (eyebrow: string) => Array.from(document.querySelectorAll<HTMLElement>('[data-shelf-eyebrow]')).find((el) => el.textContent === eyebrow)?.closest<HTMLElement>('[data-shelf-head]') ?? null;

describe('Brief 14 ShelfHeading canon', () => {
  it('eyebrow is 11 / 0.16em / uppercase; title is 21 / 700 / -0.035em / 1.05', () => {
    render(<ShelfHeading eyebrow="E" title="T" />);
    const eb = document.querySelector<HTMLElement>('[data-shelf-eyebrow]')!;
    expect(eb.style.fontSize).toBe('11px');
    expect(eb.style.letterSpacing).toBe('0.16em');
    expect(eb.style.textTransform).toBe('uppercase');
    const title = document.querySelector<HTMLElement>('[data-shelf-title]')!;
    expect(title.style.fontSize).toBe('21px');
    expect(title.style.fontWeight).toBe('700');
    expect(title.style.letterSpacing).toBe('-0.035em');
    expect(title.style.lineHeight).toBe('1.05');
  });
  it('See all present with onSeeAll, absent without', () => {
    const { unmount } = render(<ShelfHeading eyebrow="E" title="T" seeAll="S" onSeeAll={() => {}} />);
    expect(document.querySelector('[data-shelf-see-all]')).not.toBeNull();
    unmount();
    render(<ShelfHeading eyebrow="E" title="T" seeAll="S" />);
    expect(document.querySelector('[data-shelf-see-all]')).toBeNull();
  });
});

describe('Brief 14 caller mappings', () => {
  it('Shorts: eyebrow rail.shorts, title rail.shortsSub', () => {
    f.clips.data = { pages: [[longHub('c1', { duration_seconds: 40 }), longHub('c2', { duration_seconds: 40 }), longHub('c3', { duration_seconds: 40 })]] };
    wrap(<WatchFeed userId="me" onDepart={() => {}} />);
    expect(head(W.rail.shorts)?.querySelector('[data-shelf-title]')?.textContent).toBe(W.rail.shortsSub);
  });
  it('Top 100: eyebrow top100.title, title top100.sub', () => {
    f.top100 = { data: [vid('t1'), vid('t2'), vid('t3')], isError: false };
    wrap(<Top100FilmShelf userId="me" />);
    expect(head(W.top100.title)?.querySelector('[data-shelf-title]')?.textContent).toBe(W.top100.sub);
  });
  it('Creators spotlight: eyebrow creators.title, title spotlight.worthFollowing', () => {
    f.spotlight = { data: spot(), isError: false };
    wrap(<CreatorSpotlight userId="me" visitKey="v1" />);
    expect(head(W.creators.title)?.querySelector('[data-shelf-title]')?.textContent).toBe(W.spotlight.worthFollowing);
  });
});

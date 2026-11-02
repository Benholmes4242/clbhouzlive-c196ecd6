import React from 'react';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
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
  courseVideos: { data: [] as unknown[], isLoading: false, isError: false },
  regions: { data: [] as unknown[], isLoading: false, isError: false },
  regionCourses: { data: [] as unknown[] },
  gridCalls: [] as unknown[],
  grid: { data: { pages: [[]] as unknown[][] }, isSuccess: true, hasNextPage: false, isFetchingNextPage: false, fetchNextPage: vi.fn() },
  track: vi.fn(),
  openWithOrigin: vi.fn(),
  rpc: vi.fn(),
}));

vi.mock('@/features/explore-magazine/watch/useWatchVideos', () => ({ useWatchVideos: () => f.videos }));
vi.mock('@/features/explore-magazine/watch/useWatchClips', () => ({ useWatchClips: () => f.clips }));
vi.mock('@/features/explore-magazine/watch/useWatchSignals', () => ({ useWatchProgress: () => ({ data: new Map() }) }));
vi.mock('@/components/explore-tab-new/courseled/hooks/useMomentsOfTheWeek', () => ({
  useMomentsOfTheWeek: () => ({ data: [], isFetched: true, isError: false, refetch: vi.fn() }),
}));
vi.mock('@/hooks/gam/useUserAnalyticsCourses', () => ({ useUserAnalyticsCourses: () => ({ data: [] }) }));
vi.mock('@/context/ActiveActorContext', () => ({ useActiveActor: () => ({ activeActor: null }) }));
vi.mock('@/components/clubhouse/hooks/useClubhouseLikes', () => ({
  useClubhouseLikes: () => ({ handleLike: vi.fn(), getActiveLikeState: () => ({ isLiked: false, count: 0 }) }),
}));
vi.mock('@/components/explore-tab-new/courseled/MomentTile', () => ({ MomentTile: () => <div /> }));
vi.mock('@/features/explore-magazine/watch/CreatorsRow', () => ({ CreatorsRow: () => null }));
vi.mock('@/features/explore-magazine/watch/WatchLead', () => ({ WatchLead: () => <div data-stub="lead" /> }));
vi.mock('@/features/explore-magazine/watch/RoundsThisWeekShelf', () => ({ RoundsThisWeekShelf: () => <div data-stub="rounds" /> }));
vi.mock('@/features/explore-magazine/watch/useWatchMiddle', () => ({
  useCourseVideos: () => f.courseVideos,
  useWatchRegions: () => f.regions,
  useRegionCourses: () => f.regionCourses,
  useGridVideos: (_u: unknown, src: unknown) => { f.gridCalls.push(src); return f.grid; },
}));
vi.mock('@/hooks/useSupabaseSession', () => ({ useSupabaseSession: () => ({ user: { id: 'me' }, loading: false }) }));
vi.mock('@/lib/openWithOrigin', () => ({ openWithOrigin: f.openWithOrigin }));
vi.mock('@/components/explore-tab-new/courseled/mediaRailAutoplay', () => ({ registerRailVideo: () => () => {}, IN_VIEW_THRESHOLD: 0.6, MAX_PLAYING: 1 }));
vi.mock('@/components/explore-tab-new/courseled/tileHlsPlayer', () => ({ attachTileHls: () => ({ detach: vi.fn() }) }));
vi.mock('@/components/explore-tab-new/courseled/reviewVideoAutoplay', () => ({ autoplayBlocked: () => false, deliverVerdict: vi.fn() }));
vi.mock('@/hooks/usePrefersReducedMotion', () => ({ usePrefersReducedMotion: () => false }));
vi.mock('@/utils/analyticsEvents', () => ({ analyticsEvents: { track: f.track } }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { rpc: f.rpc } }));

import { WatchFeed } from '@/features/explore-magazine/watch/WatchFeed';
import { CourseVideosShelf } from '@/features/explore-magazine/watch/CourseVideosShelf';
import { RegionsShelf } from '@/features/explore-magazine/watch/RegionsShelf';
import WatchGridPage from '@/pages/WatchGridPage';
import { fetchGridPage } from '@/features/explore-magazine/watch/useWatchMiddle';
import { nextCursor, regionPath, shortAge, videosLabel, whoLine } from '@/features/explore-magazine/watch/watchMiddle';

/* fetchGridPage is mocked above with the hook module; pull the real one for the paging test. */
const real = await vi.importActual<typeof import('@/features/explore-magazine/watch/useWatchMiddle')>('@/features/explore-magazine/watch/useWatchMiddle');
void fetchGridPage;

const i18n = createInstance();
void i18n.init({ lng: 'en', initAsync: false, interpolation: { escapeValue: false }, resources: { en: { courses } } });

const hub = (id: string, dur: number) => ({ post_id: id, duration_seconds: dur, media_type: 'video', media_url: `https://x/${id}.mp4`, poster_url: null, creator_display_name: 'A', actor_id: 'a', post_created_at: '2026-10-01T00:00:00Z' });
const vid = (id: string, extra: Record<string, unknown> = {}) => ({
  post_id: id, actor_type: 'personal', actor_id: 'u1', display_name: 'Benjamin Holmes', handle: 'ben', avatar_url: null, is_verified: false,
  caption: '', media_url: `https://x/${id}.mp4`, hls_url: null, poster_url: `https://x/${id}.jpg`, stream_id: null, duration_seconds: 26,
  width: 1080, height: 1920, like_count: 0, created_at: new Date(Date.now() - 3 * 86_400_000).toISOString(),
  course_id: 'c1', course_name: 'Sundridge Park Golf Club - East Course', region: 'Kent', ...extra,
});
const region = (name: string, extra: Record<string, unknown> = {}) => ({ region: name, videos: 8, courses: 2, poster_url: null, latest_at: null, is_home: false, ...extra });

function LocationEcho() {
  const loc = useLocation();
  return <div data-testid="loc" data-path={loc.pathname} />;
}

function wrap(node: React.ReactNode, path = '/amateur', route = '*') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <I18nextProvider i18n={i18n}>
        <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
          <Routes><Route path={route} element={<>{node}<LocationEcho /></>} /><Route path="*" element={<LocationEcho />} /></Routes>
        </QueryClientProvider>
      </I18nextProvider>
    </MemoryRouter>,
  );
}

const before = (a: Element, b: Element) => !!(a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING);

beforeEach(() => {
  f.videos.data = { pages: [[hub('long1', 900)]] };
  f.clips.data = { pages: [[hub('clip1', 60)]] };
  f.courseVideos = { data: [vid('v1'), vid('v2')], isLoading: false, isError: false };
  f.regions = { data: [region('Kent', { is_home: true }), region('Down'), region('Wicklow', { videos: 1 })], isLoading: false, isError: false };
  f.regionCourses = { data: [] };
  f.grid = { data: { pages: [[]] }, isSuccess: true, hasNextPage: false, isFetchingNextPage: false, fetchNextPage: vi.fn() };
  f.gridCalls = [];
  f.track.mockClear();
  f.openWithOrigin.mockClear();
});
afterEach(cleanup);

describe('WS2 order on For you', () => {
  it('lead → Shorts → Rounds this week → Filmed at your courses → By region → Watch', () => {
    const { container } = wrap(<WatchFeed userId="me" onDepart={() => {}} />);
    const lead = container.querySelector('[data-stub="lead"]')!;
    const shorts = screen.getByText(courses.amateur.watch.rail.shorts);
    const rounds = container.querySelector('[data-stub="rounds"]')!;
    const course = container.querySelector('[data-course-shelf]')!;
    const regions = container.querySelector('[data-regions-shelf]')!;
    const watch = screen.getByText(courses.amateur.watch.rail.watch);
    const seq = [lead, shorts, rounds, course, regions, watch];
    seq.forEach((el) => expect(el).toBeTruthy());
    for (let i = 0; i < seq.length - 1; i++) expect(before(seq[i], seq[i + 1])).toBe(true);
  });

  it.each(['quick', 'long'])('neither new shelf on the %s chip', (chip) => {
    const { container } = wrap(<WatchFeed userId="me" onDepart={() => {}} initialFilter={chip} />);
    expect(container.querySelector('[data-course-shelf]')).toBeNull();
    expect(container.querySelector('[data-regions-shelf]')).toBeNull();
  });

  it('Shorts heading carries its sub-line', () => {
    wrap(<WatchFeed userId="me" onDepart={() => {}} />);
    const heading = screen.getByText(courses.amateur.watch.rail.shorts);
    expect(heading.parentElement!.textContent).toContain(courses.amateur.watch.rail.shortsSub);
  });
});

describe('Filmed at your courses', () => {
  it('is hidden under two rows and on error', () => {
    f.courseVideos = { data: [vid('v1')], isLoading: false, isError: false };
    const a = wrap(<CourseVideosShelf userId="me" />);
    expect(a.container.querySelector('[data-course-shelf]')).toBeNull();
    a.unmount();
    f.courseVideos = { data: [vid('v1'), vid('v2')], isLoading: false, isError: true };
    const b = wrap(<CourseVideosShelf userId="me" />);
    expect(b.container.querySelector('[data-course-shelf]')).toBeNull();
  });

  it('tile shows the short course name, name · age and the duration', () => {
    const { container } = wrap(<CourseVideosShelf userId="me" />);
    const tile = container.querySelector('[data-course-tile="v1"]')!;
    expect(tile.querySelector('[data-course-name]')!.textContent).not.toContain('Golf Club');
    expect(tile.querySelector('[data-course-who]')!.textContent).toBe('Benjamin Holmes \u00b7 3d');
    expect(tile.querySelector('[data-duration]')!.textContent).toBe('0:26');
  });

  it('a tap opens the viewer on that tile with the whole list', () => {
    const { container } = wrap(<CourseVideosShelf userId="me" />);
    fireEvent.click(container.querySelector('[data-course-tile="v2"]')!);
    const arg = f.openWithOrigin.mock.calls[0][0];
    expect(arg.index).toBe(1);
    expect(arg.posts).toHaveLength(2);
  });

  it('See all routes to /watch/courses', () => {
    wrap(<CourseVideosShelf userId="me" />);
    fireEvent.click(screen.getByRole('button', { name: courses.amateur.watch.seeAll }));
    expect(screen.getByTestId('loc').getAttribute('data-path')).toBe('/watch/courses');
  });
});

describe('By region', () => {
  it('is hidden under three regions', () => {
    f.regions = { data: [region('Kent'), region('Down')], isLoading: false, isError: false };
    const { container } = wrap(<RegionsShelf userId="me" />);
    expect(container.querySelector('[data-regions-shelf]')).toBeNull();
  });

  it('shows Your patch only on the home region, and singular/plural counts', () => {
    const { container } = wrap(<RegionsShelf userId="me" />);
    const patch = container.querySelectorAll('[data-your-patch]');
    expect(patch).toHaveLength(1);
    expect(container.querySelector('[data-region-tile="Kent"] [data-your-patch]')).not.toBeNull();
    expect(container.querySelector('[data-region-tile="Down"] [data-region-count]')!.textContent).toBe('8 videos');
    expect(container.querySelector('[data-region-tile="Wicklow"] [data-region-count]')!.textContent).toBe('1 video');
    expect(videosLabel(1)).toBe('1 video');
  });

  it('a tap routes to the encoded region', () => {
    f.regions = { data: [region('Kent'), region('Down'), region('Dún Laoghaire & Co')], isLoading: false, isError: false };
    const { container } = wrap(<RegionsShelf userId="me" />);
    fireEvent.click(container.querySelector('[data-region-tile="Dún Laoghaire & Co"]')!);
    expect(regionPath('Dún Laoghaire & Co')).toBe(`/watch/region/${encodeURIComponent('Dún Laoghaire & Co')}`);
    expect(f.track).toHaveBeenCalledWith('watch_region_tapped', { region: 'Dún Laoghaire & Co', is_home: false });
  });
});

describe('grid pages', () => {
  it('region page shows title and sub from the regions read', () => {
    f.regions = { data: [region('Down', { videos: 10, courses: 3 })], isLoading: false, isError: false };
    const { container } = wrap(<WatchGridPage kind="region" />, '/watch/region/Down', '/watch/region/:region');
    expect(container.querySelector('[data-grid-title]')!.textContent).toBe('Down');
    expect(container.querySelector('[data-grid-sub]')!.textContent).toBe('10 videos \u00b7 3 courses');
  });

  it('chips come from the region courses and a chip filters by course_id', () => {
    f.regionCourses = { data: [{ course_id: 'rcd', course_name: 'Royal County Down Golf Club', videos: 5 }, { course_id: 'ard', course_name: 'Ardglass', videos: 3 }] };
    const { container } = wrap(<WatchGridPage kind="region" />, '/watch/region/Down', '/watch/region/:region');
    const chips = [...container.querySelectorAll('[data-grid-chip]')].map((c) => c.getAttribute('data-grid-chip'));
    expect(chips).toEqual(['all', 'rcd', 'ard']);
    fireEvent.click(container.querySelector('[data-grid-chip="ard"]')!);
    expect(f.gridCalls[f.gridCalls.length - 1]).toEqual({ kind: 'region', region: 'Down', courseId: 'ard' });
  });

  it('Your courses has no chips', () => {
    const { container } = wrap(<WatchGridPage kind="courses" />, '/watch/courses', '/watch/courses');
    expect(container.querySelector('[data-grid-chips]')).toBeNull();
    expect(f.gridCalls[0]).toEqual({ kind: 'courses' });
  });

  it('paging passes the last created_at', async () => {
    const page = Array.from({ length: 30 }, (_, i) => ({ created_at: `2026-10-${String(30 - i).padStart(2, '0')}T00:00:00Z` }));
    expect(nextCursor(page)).toBe('2026-10-01T00:00:00Z');
    expect(nextCursor(page.slice(0, 29))).toBeUndefined();
    f.rpc.mockResolvedValue({ data: [], error: null });
    await act(async () => { await real.fetchGridPage({ kind: 'region', region: 'Down', courseId: null }, '2026-10-01T00:00:00Z'); });
    expect(f.rpc).toHaveBeenCalledWith('get_watch_region_videos', { p_region: 'Down', p_limit: 30, p_before: '2026-10-01T00:00:00Z' });
  });

  it('shows the empty state', () => {
    const { container } = wrap(<WatchGridPage kind="courses" />, '/watch/courses', '/watch/courses');
    expect(container.querySelector('[data-grid-empty]')).not.toBeNull();
  });

  it('a tap opens the viewer with the loaded list', () => {
    f.grid = { ...f.grid, data: { pages: [[vid('g1'), vid('g2'), vid('g3')]] } };
    const { container } = wrap(<WatchGridPage kind="courses" />, '/watch/courses', '/watch/courses');
    fireEvent.click(container.querySelector('[data-grid-tile="g3"]')!);
    const arg = f.openWithOrigin.mock.calls[0][0];
    expect(arg.index).toBe(2);
    expect(arg.posts).toHaveLength(3);
    expect(f.track).toHaveBeenCalledWith('watch_grid_video_opened', { kind: 'courses' });
  });
});

describe('ages', () => {
  it('reads short', () => {
    const now = new Date('2026-11-02T12:00:00Z');
    expect(shortAge('2026-10-30T12:00:00Z', now)).toBe('3d');
    expect(shortAge('2026-04-10T12:00:00Z', now)).toBe('Apr');
    expect(whoLine({ display_name: 'Danny', created_at: null as unknown as string }, now)).toBe('Danny');
  });
});

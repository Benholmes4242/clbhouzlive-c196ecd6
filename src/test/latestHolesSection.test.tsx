import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { CourseHole, CourseHoleAnalysis } from '@/hooks/gam/useCourseHoleAnalysis';
import type { HolePhoto } from '@/lib/courseMedia/holePhotoData';

const f = vi.hoisted(() => ({ latest: [] as import('@/components/courses/browse/LatestHolesSection').LatestHoleMedia[], loading: false, error: false, rpc: vi.fn(), analysis: null as CourseHoleAnalysis | null, rows: [] as HolePhoto[], total: 8, known: vi.fn(), holeRpc: vi.fn(), open: vi.fn(), register: vi.fn() }));
vi.mock('@/components/explore-tab-new/courseled/reviewVideoAutoplay', async o => ({ ...await o<object>(), registerReviewVideo: (...a: unknown[]) => { f.register(...a); return () => {}; } }));
vi.mock('react-i18next', () => ({ initReactI18next: { type: '3rdParty', init: () => {} }, useTranslation: () => ({ t: (_k: string, o?: { defaultValue?: string }) => o?.defaultValue ?? '' }) }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { rpc: (...args: unknown[]) => f.holeRpc(...args) } }));
vi.mock('@/lib/openWithOrigin', () => ({ openWithOrigin: (...args: unknown[]) => f.open(...args) }));
vi.mock('@/hooks/useSupabaseSession', () => ({ useSupabaseSession: () => ({ user: { id: 'member' } }) }));
vi.mock('@/hooks/gam/useCourseHoleAnalysis', () => ({ useCourseHoleAnalysis: () => ({ isSuccess: true, data: f.analysis }) }));
vi.mock('@/components/course-media-tab/hooks/useHolePhotoTagging', () => ({ useHolePhotoTagging: (_course: string, _member: string, known: number[] | null) => {
  f.known(known);
  return { ready: true, own: { data: [] }, sources: { data: [], isSuccess: true }, tags: { data: f.rows, isSuccess: true }, taggedUrls: new Set(), submit: { reset: vi.fn() }, move: { reset: vi.fn() }, remove: { reset: vi.fn() } };
} }));
vi.mock('@/components/course-media-tab/hooks/useCourseMedia', () => ({ useCourseMedia: () => ({ posts: [], postsForFullscreen: [], mediaCounts: { total: f.total, photos: f.total, videos: 0 }, countsReady: true }) }));
vi.mock('@/uploads/hooks/useMediaUpload', () => ({ useMediaUpload: () => ({ upload: vi.fn() }) }));
vi.mock('@/components/course-media-tab/CourseMediaCanonGrid', () => ({ CourseMediaCanonGrid: () => null }));
vi.mock('@/components/course-media-tab/CourseMediaHeader', () => ({ CourseMediaHeader: () => null }));
vi.mock('@/components/course-media-tab/hooks/useCoursePlaceMedia', () => ({ useCoursePlaceMedia: () => ({ tags: { data: [], isSuccess: true } }) }));
vi.mock('@/components/common/ScrollToTopGlass', () => ({ default: () => null }));

vi.mock('@/components/course-media-tab/hooks/useCourseGallery', () => ({ useCourseGallery: () => f.open }));
vi.mock('@tanstack/react-query', async importOriginal => ({ ...await importOriginal<typeof import('@tanstack/react-query')>(), useInfiniteQuery: (options: unknown) => { f.rpc(options); return { data: { pages: [f.latest] }, isLoading: f.loading, isError: f.error, hasNextPage: false, isFetching: f.loading, isFetchingNextPage: false, fetchNextPage: vi.fn() }; } }));

import { LatestHolesSection } from '@/components/courses/browse/LatestHolesSection';
import { holeMediaPoster } from '@/lib/courseMedia/holePhotoData';
import type { LatestHoleMedia } from '@/components/courses/browse/LatestHolesSection';
import { courseWalkHoles, deriveHoleWalk, UNSCORED_HOLE_COUNT } from '@/lib/courseMedia/holeWalk';
import { HoleWalk } from '@/components/course-media-tab/HoleWalk';
import CourseMediaTabNew from '@/components/course-media-tab/CourseMediaTabNew';

const emptyAnalysis: CourseHoleAnalysis = { available: true, total_rounds: 0, holes: [] };
const hole = (n: number): CourseHole => ({ hole_no: n, par: 4, yards: 412, stroke_index: 3, rounds: 10, avg_to_par: 1, avg_gross: 5, dist: { ace: 0, albatross: 0, eagle: 0, birdie: 0, par: 5, bogey: 5, double: 0 } });
const photo = (n: number, id = String(n)): HolePhoto => ({ id, course_id: 'course', hole_no: n, status: 'approved', user_id: 'member', media_type: 'image', media_url: `/photo-${id}.jpg`, exif_captured_at: null }) as HolePhoto;
const numbers = Array.from({ length: 18 }, (_, i) => i + 1);
const quiet = 'No rounds have been posted here yet, so par and yardage are still to come. They fill in with the first tracked round.';
function unscored() {
  const result = courseWalkHoles(emptyAnalysis);
  if (!result) throw new Error('Expected available unscored holes');
  return result.holes;
}
const holeRow = (id: string, over: Record<string, unknown> = {}) => ({ id, course_id: 'course-second', course_name: 'Course second', hole_no: 4, media_type: 'image', media_url: `/hole-${id}.jpg`, poster_url: null, stream_id: null, duration_seconds: null, added_at: '2025-06-12T10:00:00Z', member_id: 'member', member_name: 'Thomas Holmes', par: 3, yards: 182, ...over });
beforeEach(() => {
  vi.clearAllMocks(); f.analysis = emptyAnalysis; f.rows = [photo(1), photo(4), photo(7), photo(15)]; f.total = 8; f.latest = [latest('first'), latest('second'), latest('third')]; f.loading = false; f.error = false;
  f.holeRpc.mockResolvedValue({ data: [holeRow('h1'), holeRow('second'), holeRow('h3')], error: null });
});
afterEach(cleanup);
function mountTab(entry = '/courses/course?tab=media&hole=4&shot=selected') {
  const cache = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const make = () => <MemoryRouter initialEntries={[entry]}><QueryClientProvider client={cache}><CourseMediaTabNew courseId="course" courseName="Old Head Golf Links" /></QueryClientProvider></MemoryRouter>;
  return { ...render(make()), make };
}


function latest(id: string, overrides: Partial<LatestHoleMedia> = {}): LatestHoleMedia {
  return { id, course_id: `course-${id}`, course_name: `Course ${id}`, hole_no: 4, media_type: 'image', media_url: `/photo-${id}.jpg`, poster_url: null, stream_id: null, duration_seconds: null, exif_captured_at: '2026-09-14T12:00:00Z', added_at: '2025-06-12T10:00:00Z', created_at: '2026-10-24T12:00:00Z', member_id: 'member', member_name: 'Thomas Holmes', member_avatar_url: null, par: 3, yards: 182, ...overrides };
}
function mountRail() {
  const cache = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<MemoryRouter><QueryClientProvider client={cache}><LatestHolesSection /></QueryClientProvider></MemoryRouter>);
}

describe('BRIEF_COURSES_LATEST_HOLES', () => {
  it.each([0, 1, 2])('fewer than three rows hides the rail (%i)', count => {
    f.latest = f.latest.slice(0, count); mountRail(); expect(screen.queryAllByRole('button')).toHaveLength(0);
  });
  it('three cards retain RPC order and the specified query contract', () => {
    mountRail(); expect(screen.getAllByRole('button').map(b => b.getAttribute('aria-label'))).toEqual(['Hole 4, Course first', 'Hole 4, Course second', 'Hole 4, Course third']);
    expect(f.rpc).toHaveBeenCalledWith(expect.objectContaining({ queryKey: ['gam_rpc', 'get_latest_hole_media', 'infinite', expect.anything(), false], staleTime: 60_000 }));
    const options = f.rpc.mock.calls[0][0];
    const request = options.queryFn({ pageParam: undefined });
    expect(f.holeRpc).toHaveBeenCalledWith('get_latest_hole_media', { p_limit: 20 });
    return request;
  });
  it('two shots from one course render as two cards', () => {
    f.latest = [latest('first'), latest('second', { course_id: 'course-first', course_name: 'Course first' }), latest('third')];
    mountRail(); const cards = screen.getAllByRole('button');
    expect(cards).toHaveLength(3);
    expect(cards.map(c => c.getAttribute('aria-label'))).toEqual(['Hole 4, Course first', 'Hole 4, Course first', 'Hole 4, Course third']);
  });
  it('an RPC error hides even cached rows', () => { f.error = true; mountRail(); expect(screen.queryAllByRole('button')).toHaveLength(0); });
  it('loading draws the shell without interactive cards', () => { f.loading = true; const view = mountRail(); expect(view.container.querySelector('section[aria-hidden]')).not.toBeNull(); expect(screen.queryAllByRole('button')).toHaveLength(0); });
  it('labels distinguish scored, unscored and absent yardage', () => {
    f.latest = [latest('first'), latest('second', { par: null, yards: null }), latest('third', { yards: null })];
    mountRail(); expect(screen.getByText('Par 3 · 182 yds')).toBeInTheDocument(); expect(screen.getByText('Hole')).toBeInTheDocument(); expect(screen.getByText('Par 3')).toBeInTheDocument();
  });
  it('credit uses the added date and ignores EXIF capture', () => {
    f.latest = [latest('first'), latest('second', { exif_captured_at: '2020-01-05T12:00:00Z' }), latest('third', { exif_captured_at: null })];
    const view = mountRail(); expect(screen.getAllByText('Thomas Holmes · Jun 2025')).toHaveLength(3);
    expect(view.container.textContent).not.toContain('Sep 2026'); expect(view.container.textContent).not.toContain('Jan 2020');
  });
  it('member_name null shows the added month alone', () => {
    f.latest = [latest('first'), latest('second', { member_name: null }), latest('third')];
    const view = mountRail(); expect(screen.getByText('Jun 2025')).toBeInTheDocument();
    expect(view.container.querySelectorAll('.latest-hole-credit')).toHaveLength(3);
  });
  it('credit month is UTC, not the timestamp offset month', () => {
    f.latest[0] = latest('first', { added_at: '2025-07-01T00:30:00+02:00' }); mountRail(); expect(screen.getAllByText('Thomas Holmes · Jun 2025')).toHaveLength(3);
  });
  it('video uses its shared poster and rounded duration while images have no chip', () => {
    const video = latest('first', { media_type: 'video', poster_url: '/video-poster.jpg', duration_seconds: 14.2 }); f.latest[0] = video;
    const view = mountRail(); const cards = screen.getAllByRole('button'); expect(cards[0].querySelector('img')).toHaveAttribute('src', holeMediaPoster(video));
    expect(cards[0].querySelector('.glass-chip')?.textContent).toBe('0:14'); expect(cards[1].querySelector('.glass-chip')).toBeNull(); expect(view.container.querySelectorAll('video')).toHaveLength(1); expect(cards[0].querySelector('video')).not.toBeNull();
  });
  it('a video tile renders HoleInlineVideo in the courses-member-shots group; photo tiles never render a video', () => {
    f.latest[0] = latest('first', { media_type: 'video', poster_url: '/video-poster.jpg' });
    mountRail(); const cards = screen.getAllByRole('button');
    expect(cards[0].querySelector('video')).not.toBeNull();
    expect(f.register).toHaveBeenCalledWith('courses-member-shots', expect.anything(), expect.any(Function), { threshold: 0.5, maxPlaying: 1 });
    expect(cards[1].querySelector('video')).toBeNull(); expect(cards[2].querySelector('video')).toBeNull();
  });
  it('video duration formats longer than one minute', () => { f.latest[0] = latest('first', { media_type: 'video', duration_seconds: 75 }); mountRail(); expect(screen.getByText('1:15')).toBeInTheDocument(); });
  it('the kicker reads "Hole by hole"', () => {
    mountRail(); expect(screen.getByText('Hole by hole')).toBeInTheDocument(); expect(screen.getByText('Latest holes')).toBeInTheDocument();
  });
  it('a tap opens the canonical viewer readOnly on the tapped shot across the whole rail', () => {
    mountRail(); fireEvent.click(screen.getByRole('button', { name: 'Hole 4, Course second' }));
    expect(f.holeRpc).not.toHaveBeenCalled();
    expect(f.open).toHaveBeenCalledTimes(1);
    const args = f.open.mock.calls[0][0] as { posts: Array<{ id: string; displayName: string; courseName?: string; mediaItems: Array<{ id: string }> }>; index: number; mediaId: string | null; openedFrom: string; options?: { readOnly?: boolean } };
    expect(args.posts).toHaveLength(1);
    expect(args.posts[0].id).toBe('shots:latest-holes');
    expect(args.posts[0].mediaItems.map(item => item.id)).toEqual(['first', 'second', 'third']);
    expect(args.index).toBe(0);
    expect(args.mediaId).toBe('second');
    expect(args.openedFrom).toBe('course-media');
    expect(args.options).toEqual({ readOnly: true, syntheticPosts: true });
    expect(args.posts[0].displayName).toBe('Latest holes');
    expect(args.posts[0].courseName).toBe('');
  });
  it('the section opens the canonical viewer, never MediaPreviewViewer', () => {
    const source = readFileSync(resolve(process.cwd(), 'src/components/courses/browse/LatestHolesSection.tsx'), 'utf8');
    expect(source).not.toContain('MediaPreviewViewer');
    expect(source).toContain('openWithOrigin');
  });
  it('a tap opens immediately with no network wait', () => {
    f.holeRpc.mockReturnValue(new Promise(() => {}));
    mountRail(); const card = screen.getByRole('button', { name: 'Hole 4, Course second' });
    fireEvent.click(card);
    expect(f.open).toHaveBeenCalledTimes(1);
    expect(f.holeRpc).not.toHaveBeenCalled();
    fireEvent.click(card);
    expect(f.open).toHaveBeenCalledTimes(2);
  });
  it('Media deep link opens hole four with the selected shot, not its first shot — course gallery', () => {
    f.rows=[photo(4,'first'),photo(4,'selected')]; mountTab(); expect(f.open).toHaveBeenCalledWith('holes','selected',expect.anything(),'deep-link',4); expect(screen.queryByRole('region')).toBeNull();
  });
  it('missing linked shot falls back to the hole first shot — course gallery', () => {
    f.rows=[photo(4,'first'),photo(4,'other')]; mountTab(); expect(f.open).toHaveBeenCalledWith('holes','selected',expect.anything(),'deep-link',4); expect(deriveHoleWalk([hole(4)],f.rows).tiles[0].photos[0].id).toBe('first');
  });
  it('unknown hole never opens a panel — course gallery', () => {
    mountTab('/courses/course?tab=media&hole=99&shot=selected'); expect(f.open).not.toHaveBeenCalled(); expect(screen.queryByRole('region')).toBeNull();
  });
  it('deep link waits for known holes and does not reapply after user selection — course gallery', () => {
    f.analysis=null; const view=mountTab(); expect(f.open).not.toHaveBeenCalled(); f.analysis=emptyAnalysis; f.rows=[photo(4,'selected'),photo(7)]; view.rerender(view.make()); expect(f.open).toHaveBeenCalledTimes(1); expect(f.open).toHaveBeenCalledWith('holes','selected',expect.anything(),'deep-link',4); fireEvent.click(screen.getByRole('button',{name:'Hole 7'})); expect(f.open).toHaveBeenCalledTimes(2); view.rerender(view.make()); expect(f.open).toHaveBeenCalledTimes(2);
  });
  it('card type reads the signed-off mock letter-spacing and the rail declares no will-change', () => {
    const css = readFileSync(resolve(process.cwd(), 'src/components/courses/browse/latestHoles.css'), 'utf8');
    expect(css).toMatch(/\.latest-hole-number\s*\{[^}]*letter-spacing: -0\.05em;/);
    expect(css).toMatch(/\.latest-hole-label\s*\{[^}]*letter-spacing: 0\.16em;/);
    expect(css).toMatch(/\.latest-hole-course\s*\{[^}]*letter-spacing: -0\.03em;/);
    expect(css).not.toContain('will-change');
  });
});

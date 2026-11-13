import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { LatestCoursesSection, type LatestCourseMedia } from '@/components/courses/browse/LatestCoursesSection';
import { coursePostsToShotPosts, courseTilesToShotPost, latestHoleRowsToFeedPosts, latestHolesToFeedPosts, type MemberShotRow } from '@/lib/courseMedia/memberShotPosts';
import { useFullscreenFeedStore } from '@/store/fullscreenFeedStore';
import { galleryCourseMediaQuery } from '@/components/explore-tab-new/courseled/hooks/useGalleryCourseMedia';
import type { FeedPost, MediaItem } from '@/components/media-system/types/media';

const h = vi.hoisted(() => ({ rows: [] as LatestCourseMedia[], data: [] as FeedPost[], rpc: vi.fn() }));
vi.mock('react-i18next', () => ({ initReactI18next: { type: '3rdParty', init: () => {} }, useTranslation: () => ({ t: (_k: string, o?: { defaultValue?: string }) => o?.defaultValue ?? '' }) }));
vi.mock('@/hooks/useSupabaseSession', () => ({ useSupabaseSession: () => ({ user: { id: 'member' }, loading: false }) }));
vi.mock('@/context/ActiveActorContext', () => ({ useActiveActor: () => ({ activeActor: { type: 'personal', id: 'actor' } }) }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { rpc: h.rpc } }));
vi.mock('@tanstack/react-query', async original => ({ ...await original<typeof import('@tanstack/react-query')>(), useInfiniteQuery: () => ({ data: { pages: [h.rows] }, isLoading: false, isFetched: true, isError: false, hasNextPage: false, isFetching: false, isFetchingNextPage: false, fetchNextPage: vi.fn() }) }));
vi.mock('@/components/explore-tab-new/courseled/hooks/useGalleryCourseMedia', async original => ({ ...await original<typeof import('@/components/explore-tab-new/courseled/hooks/useGalleryCourseMedia')>(), useGalleryCourseMedia: () => ({ data: h.data, isError: false }) }));

const item = (id: string): MediaItem => ({ id, type: 'image', imageUrl: `/${id}.jpg`, width: 1080, height: 1920 });
const row = (i: number): LatestCourseMedia => ({ course_id: `c${i}`, course_name: `Course ${i}`, latest_at: '', media_count: 5, contributor_count: 1, latest_member_name: null,
  tiles: [0, 1, 2].map(n => ({ post_id: `p${i}`, media_id: `m${i}-${n}`, media_type: 'image', media_url: `/m${i}-${n}.jpg`, poster_url: null, stream_id: null, duration_seconds: null, created_at: '2026-11-01T00:00:00Z' })) });
const hole = (id: string, over: Partial<MemberShotRow> = {}): MemberShotRow => ({ id, course_id: id, course_name: `Course ${id}`, media_type: 'image', media_url: `/${id}.jpg`, hole_no: 4, par: 4, yards: 400, member_id: 'member', member_name: 'Thomas Holmes', member_avatar_url: '/avatar.jpg', source_post_id: 'source', added_at: '2026-11-01T00:00:00Z', ...over });
let cache: QueryClient;
beforeEach(() => {
  vi.clearAllMocks();
  useFullscreenFeedStore.setState({ isOpen: false, posts: [], openedFrom: null, activeIndex: 0, activePagerIdx: 0, restoreStack: [] });
  h.rows = [0, 1, 2, 3, 4].map(row);
  h.data = [{ ...courseTilesToShotPost(row(2)), id: 'p2', userId: 'member', displayName: 'Thomas Holmes', mediaItems: [0, 1, 2, 3, 4].map(n => item(`m2-${n}`)) }];
  cache = new QueryClient({ defaultOptions: { queries: { retry: false } } });
});
afterEach(() => { cleanup(); cache.clear(); useFullscreenFeedStore.setState({ isOpen: false, posts: [], openedFrom: null }); });
function mount() { return render(<MemoryRouter><QueryClientProvider client={cache}><LatestCoursesSection /></QueryClientProvider></MemoryRouter>); }

describe('member-shot vertical paging', () => {
  it('three hole rows produce three ordered single-item pages with byte-identical captions', () => {
    const rows = [hole('a'), hole('b'), hole('c')];
    const posts = latestHoleRowsToFeedPosts(rows);
    expect(posts.map(p => p.id)).toEqual(['shots:latest-hole:a', 'shots:latest-hole:b', 'shots:latest-hole:c']);
    expect(posts.map(p => p.mediaItems.map(m => m.id))).toEqual([['a'], ['b'], ['c']]);
    rows.forEach((r, i) => expect(posts[i].mediaItems[0].memberShot).toEqual(latestHolesToFeedPosts([r])[0].mediaItems[0].memberShot));
  });
  it('null-duration hole videos produce no page', () => {
    expect(latestHoleRowsToFeedPosts([hole('v', { media_type: 'video', stream_id: 'a'.repeat(32), duration_seconds: null })])).toEqual([]);
  });
  it('course placeholders keep three tile ids in rail order and empty member identity', () => {
    const post = courseTilesToShotPost(row(1));
    expect(post.id).toBe('shots:course:c1');
    expect(post.mediaItems.map(m => m.id)).toEqual(['m1-0', 'm1-1', 'm1-2']);
    for (const m of post.mediaItems) expect(m.memberShot).toEqual({ kicker: "Through members' eyes", title: 'Course 1', courseId: 'c1', courseName: 'Course 1', credit: '', memberName: '', avatarUrl: null });
  });
  it('course placeholders use gallery video mapping and exclude processing videos', () => {
    const course = row(1);
    course.tiles[0] = { ...course.tiles[0], media_type: 'video', stream_id: 'a'.repeat(32), duration_seconds: null };
    course.tiles[1] = { ...course.tiles[1], media_type: 'video', stream_id: 'b'.repeat(32), duration_seconds: 20 };
    const post = courseTilesToShotPost(course);
    expect(post.mediaItems.map(m => m.id)).toEqual(['m1-1', 'm1-2']);
    expect(post.mediaItems[0]).toMatchObject({ type: 'video', streamId: 'b'.repeat(32), isProcessing: false, duration: 20 });
  });
  it('appendPostMedia preserves active items and pager index while appending unique ids in order', () => {
    const post = courseTilesToShotPost(row(1));
    useFullscreenFeedStore.setState({ isOpen: true, posts: [post], activeIndex: 0, activePagerIdx: 1 });
    const memberShot = { kicker: "Through members' eyes", title: 'Course 1',
      memberName: 'Thomas Holmes', credit: 'Thomas Holmes · Mar 2026', avatarUrl: '/t.jpg' };
    const incoming = [{ ...post.mediaItems[0], imageUrl: '/must-not-replace.jpg', width: 1, memberShot }, item('X'), item('Y'), item('X')];
    useFullscreenFeedStore.getState().appendPostMedia(post.id, incoming);
    const state = useFullscreenFeedStore.getState();
    expect(state.posts[0].mediaItems[0]).toEqual({ ...post.mediaItems[0], memberShot });
    expect(state.posts[0].mediaItems.slice(1, 3)).toEqual(post.mediaItems.slice(1, 3));
    expect(state.posts[0].mediaItems[1]).toBe(post.mediaItems[1]);
    expect(state.posts[0].mediaItems.map(m => m.id)).toEqual(['m1-0', 'm1-1', 'm1-2', 'X', 'Y']);
    expect(state.activePagerIdx).toBe(1);
    expect(state.activeIndex).toBe(0);
    state.appendPostMedia(post.id, incoming);
    expect(useFullscreenFeedStore.getState().posts).toBe(state.posts);
    state.appendPostMedia(post.id, [{ ...incoming[0], memberShot: { ...memberShot } }]);
    expect(useFullscreenFeedStore.getState().posts).toBe(state.posts);
  });
  it('missing post ids, closed viewers and duplicate-only appends are no-ops', () => {
    const post = courseTilesToShotPost(row(1));
    useFullscreenFeedStore.setState({ isOpen: true, posts: [post] });
    const state = useFullscreenFeedStore.getState();
    state.appendPostMedia('missing', [item('X')]);
    expect(useFullscreenFeedStore.getState()).toBe(state);
    state.appendPostMedia(post.id, post.mediaItems);
    expect(useFullscreenFeedStore.getState()).toBe(state);
    useFullscreenFeedStore.setState({ isOpen: false });
    const closed = useFullscreenFeedStore.getState();
    closed.appendPostMedia(post.id, [item('X')]);
    expect(useFullscreenFeedStore.getState()).toBe(closed);
  });
  it('tapping course two opens every loaded course, the tapped full set and other tile sets', async () => {
    vi.spyOn(cache, 'fetchQuery').mockImplementation(() => new Promise(() => {}));
    mount(); fireEvent.click(screen.getByRole('button', { name: 'Open Course 2 shot 2 of 5' }));
    await waitFor(() => expect(useFullscreenFeedStore.getState().isOpen).toBe(true));
    const state = useFullscreenFeedStore.getState();
    expect(state.posts.map(p => p.id)).toEqual([0, 1, 2, 3, 4].map(i => `shots:course:c${i}`));
    expect(state.activeIndex).toBe(2);
    expect(state.mediaId).toBe('m2-1');
    expect(state.openedFrom).toBe('courses-latest-courses');
    expect([state.readOnly, state.syntheticPosts]).toEqual([true, true]);
    expect(state.posts[2].mediaItems.map(m => m.id)).toEqual([0, 1, 2, 3, 4].map(n => `m2-${n}`));
    expect(state.posts[1].mediaItems.map(m => m.id)).toEqual(['m1-0', 'm1-1', 'm1-2']);
  });
  it('active course two fills only courses one and three and appends resolved media', async () => {
    let finish: ((posts: FeedPost[]) => void) | undefined;
    const fetch = vi.spyOn(cache, 'fetchQuery').mockImplementation(() => new Promise<FeedPost[]>(resolve => { finish = resolve; }));
    const append = vi.spyOn(useFullscreenFeedStore.getState(), 'appendPostMedia');
    mount(); fireEvent.click(screen.getByRole('button', { name: 'Open Course 2 shot 1 of 5' }));
    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(2));
    expect(fetch.mock.calls.map(([q]) => q.queryKey)).toEqual([
      ['gallery-course-media', 'c1', 'member', 'personal', 'actor'], ['gallery-course-media', 'c3', 'member', 'personal', 'actor'],
    ]);
    const result = [{ ...courseTilesToShotPost(row(3)), mediaItems: [item('X')] }];
    await act(async () => finish?.(result));
    expect(append).toHaveBeenCalledWith('shots:course:c3', coursePostsToShotPosts(result, 'c3', 'Course 3')[0].mediaItems);
    expect(useFullscreenFeedStore.getState().posts[3].mediaItems.map(m => m.id)).toEqual(['m3-0', 'm3-1', 'm3-2', 'X']);
  });
  it('rapid vertical changes cap outstanding fills at three and fill only the current window afterward', async () => {
    const finishes: Array<(posts: FeedPost[]) => void> = [];
    const fetch = vi.spyOn(cache, 'fetchQuery').mockImplementation(() => new Promise<FeedPost[]>(resolve => { finishes.push(resolve); }));
    mount(); fireEvent.click(screen.getByRole('button', { name: 'Open Course 2 shot 1 of 5' }));
    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(2));
    act(() => useFullscreenFeedStore.getState().setActiveIndex(0));
    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(3));
    act(() => useFullscreenFeedStore.getState().setActiveIndex(4));
    expect(fetch).toHaveBeenCalledTimes(3);
    await act(async () => finishes[0]([]));
    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(4));
    expect(fetch.mock.calls.map(([q]) => q.queryKey?.[1])).toEqual(['c1', 'c3', 'c0', 'c4']);
  });
  it('failed neighbour reads keep tiles and old completions cannot append after close', async () => {
    let finish: ((posts: FeedPost[]) => void) | undefined;
    vi.spyOn(cache, 'fetchQuery').mockImplementationOnce(() => Promise.reject(new Error('unavailable')))
      .mockImplementation(() => new Promise<FeedPost[]>(resolve => { finish = resolve; }));
    mount(); fireEvent.click(screen.getByRole('button', { name: 'Open Course 2 shot 1 of 5' }));
    await waitFor(() => expect(useFullscreenFeedStore.getState().posts).toHaveLength(5));
    expect(useFullscreenFeedStore.getState().posts[1].mediaItems).toHaveLength(3);
    act(() => useFullscreenFeedStore.setState({ isOpen: false, posts: [], openedFrom: null }));
    await act(async () => finish?.(h.data));
    expect(useFullscreenFeedStore.getState().posts).toEqual([]);
  });
  it('the extracted gallery query preserves keys, lifetimes and RPC actor parameters', async () => {
    h.rpc.mockResolvedValue({ data: [], error: null });
    const query = galleryCourseMediaQuery('c2', 'member', 'business', 'business-id');
    expect(query.queryKey).toEqual(['gallery-course-media', 'c2', 'member', 'business', 'business-id']);
    expect(query.staleTime).toBe(120000);
    expect(query.gcTime).toBe(600000);
    expect(query.enabled).toBe(true);
    await query.queryFn();
    expect(h.rpc).toHaveBeenCalledWith('get_course_media_v2', { p_user_id: 'member', p_course_id: 'c2', p_filter: 'all', p_page_size: 30, p_seen_post_ids: [], p_viewer_actor_type: 'business', p_viewer_actor_id: 'business-id' });
  });
});
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import type { FeedPost } from '@/components/media-system/types/media';
import type { HolePhoto } from '@/lib/courseMedia/holePhotoData';
import { holeMediaKey } from '@/lib/courseMedia/holePhotoData';
import { galleryShots, type GalleryShot } from '@/lib/courseMedia/courseGallery';
import { useFullscreenFeedStore } from '@/store/fullscreenFeedStore';

const f = vi.hoisted(() => ({ resolves: [] as ((rows: unknown[]) => void)[] }));
vi.mock('@/context/ActiveActorContext', () => ({ useActiveActor: () => ({ activeActor: { type: 'personal', id: 'me' } }) }));
vi.mock('@/utils/analyticsEvents', () => ({ analyticsEvents: { track: vi.fn() } }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { rpc: () => new Promise(resolve => { f.resolves.push(rows => resolve({ data: rows, error: null })); }) } }));
vi.mock('@/components/media-system/utils/feedMapper', () => ({ mapRowToFeedPost: (row: { id: string }) => post(row.id) }));
vi.mock('@/lib/courseMedia/holeMediaQuery', () => ({ holeMediaQuery: (courseId: string, n: number) => ({ queryKey: ['opening-holes', courseId, n], queryFn: async () => [] }) }));
// Only origin/media borrowing is isolated; the real store initializes and replaces the gallery.
vi.mock('@/lib/openWithOrigin', () => ({ openWithOrigin: (args: { posts: FeedPost[]; index: number; mediaId: string; mediaIndex?: number; options: object }) => {
  useFullscreenFeedStore.getState().open(args.posts, args.index, { ...args.options, mediaId: args.mediaId, mediaIndex: args.mediaIndex });
} }));
import { courseGalleryKey, findStart, useCourseGallery } from '@/components/course-media-tab/hooks/useCourseGallery';

function post(id: string): FeedPost {
  return { id: `post-${id}`, userId: 'me', actorId: 'me', actorType: 'personal', displayName: '', avatarUrl: '', username: '', isVerified: false, creatorRelation: 'none', caption: '', createdAt: '2026-01-01T00:00:00Z', mediaItems: [{ id, type: 'image', imageUrl: `/${id}.jpg`, width: 1000, height: 1000 }], likeCount: 0, commentCount: 0, shareCount: 0, review: null, isReview: false, isLikedByMe: false, isFollowedByMe: false };
}
const tag = (id: string, hole_no: number): HolePhoto => ({ id, hole_no, media_url: `/${id}.jpg`, media_type: 'image', user_id: 'me', course_id: 'course', added_at: '2026-01-01T00:00:00Z', status: 'approved' }) as HolePhoto;
const clients: QueryClient[] = [];
function setup(tags: HolePhoto[] = [], warm?: GalleryShot[]) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  clients.push(client);
  const args = { courseId: 'course', courseName: 'Course', userId: 'me', actorType: 'personal', actorId: 'me', holeTags: tags, placeTags: [] };
  if (warm) client.setQueryData(courseGalleryKey(args), warm);
  const wrapper = ({ children }: { children: ReactNode }) => <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  const hook = renderHook(({ holeTags }: { holeTags: HolePhoto[] }) => useCourseGallery({ ...args, holeTags, holes: [], scored: false, pagePosts: [post('a'), post('b')], tagsReady: true }), { wrapper, initialProps: { holeTags: tags } });
  return { ...hook, client, args };
}
beforeEach(() => { f.resolves = []; useFullscreenFeedStore.setState({ isOpen: false, courseGallery: null, galleryData: null, restoreStack: [] }); });
afterEach(() => { cleanup(); clients.splice(0).forEach(client => client.clear()); useFullscreenFeedStore.setState({ isOpen: false, courseGallery: null, galleryData: null, restoreStack: [] }); });
const rows = (ids: string[]) => ids.map(id => ({ id, post_id: `post-${id}` }));

describe('course gallery opening selection', () => {
  const holes = () => galleryShots([post('a'), post('b'), post('c')], [tag('a', 9), tag('b', 16), tag('c', 17)], []);
  it('undefined id selects hole 16 rather than the first absent place tag', () => expect(findStart(holes(), undefined, 16)?.id).toBe('b'));
  it('undefined or empty id without a hole selects the first shot', () => { expect(findStart(holes())?.id).toBe('a'); expect(findStart(holes(), '')?.id).toBe('a'); });
  it('hole-tag ids remain valid start ids', () => { const list = holes().map(s => s.id === 'b' ? { ...s, holeTag: tag('hole-tag', 16) } : s); expect(findStart(list, 'hole-tag')?.id).toBe('b'); });
  it('place-tag ids remain valid start ids', () => { const list = holes().map(s => s.id === 'b' ? { ...s, placeTag: { ...tag('place-tag', 16), place: 'views' } } : s) as GalleryShot[]; expect(findStart(list, 'place-tag')?.id).toBe('b'); });
  it('canonical key finds a shot whose feed id differs from its tile id, including Stream video', () => {
    const video = post('feed-video'); video.mediaItems[0] = { ...video.mediaItems[0], type: 'video', streamId: 'a'.repeat(32) };
    const list = galleryShots([post('a'), video], [], []);
    expect(findStart(list, 'tile-id', undefined, holeMediaKey(video.mediaItems[0]))?.id).toBe('feed-video');
  });
  it('opening hole 9 then 16 then 17 publishes each hole position synchronously', async () => {
    const hook = setup([], holes());
    for (const [n, id, index] of [[9, 'a', 0], [16, 'b', 1], [17, 'c', 2]] as const) {
      await act(async () => { await hook.result.current('holes', undefined, null, 'hole-card', n); });
      expect(useFullscreenFeedStore.getState()).toMatchObject({ mediaId: id, mediaIndex: index, activePagerIdx: index });
      act(() => useFullscreenFeedStore.getState().close());
    }
  });
  it('Everything opens B after closing A', async () => {
    const hook = setup([], galleryShots([post('a'), post('b')], [], []));
    await act(async () => { await hook.result.current('all', 'a', null, 'everything'); });
    act(() => useFullscreenFeedStore.getState().close());
    await act(async () => { await hook.result.current('all', 'b', null, 'everything'); });
    expect(useFullscreenFeedStore.getState()).toMatchObject({ mediaId: 'b', mediaIndex: 1, activePagerIdx: 1 });
  });
  it('a changed tag key hydrates B before any pager publication without moving it', async () => {
    const hook = setup([], galleryShots([post('a'), post('b')], [], []));
    hook.rerender({ holeTags: [tag('b', 16)] });
    await waitFor(() => expect(f.resolves).toHaveLength(1));
    let pending: Promise<void> | undefined;
    act(() => { pending = hook.result.current('all', 'b', null, 'everything'); });
    expect(useFullscreenFeedStore.getState()).toMatchObject({ mediaId: 'b', mediaIndex: 1, activePagerIdx: 1 });
    await act(async () => { f.resolves[0](rows(['a', 'b'])); await pending; });
    expect(useFullscreenFeedStore.getState()).toMatchObject({ mediaId: 'b', mediaIndex: 1, activePagerIdx: 1 });
  });
  it('hydration preserves a swipe away from the opening shot', async () => {
    const hook = setup(); await waitFor(() => expect(f.resolves).toHaveLength(1));
    let pending: Promise<void> | undefined;
    act(() => { pending = hook.result.current('all', 'b', null, 'everything'); });
    act(() => useFullscreenFeedStore.getState().setActivePagerIdx(0));
    await act(async () => { f.resolves[0](rows(['z', 'a', 'b'])); await pending; });
    expect(useFullscreenFeedStore.getState()).toMatchObject({ mediaId: 'a', activePagerIdx: 1 });
  });
  it('an earlier A build resolving after a newer B open cannot overwrite B', async () => {
    const first = setup(); await waitFor(() => expect(f.resolves).toHaveLength(1));
    let a: Promise<void> | undefined; act(() => { a = first.result.current('all', 'a', null, 'everything'); });
    act(() => useFullscreenFeedStore.getState().close());
    const second = setup(); await waitFor(() => expect(f.resolves).toHaveLength(2));
    let b: Promise<void> | undefined; act(() => { b = second.result.current('all', 'b', null, 'everything'); });
    await act(async () => { f.resolves[1](rows(['a', 'b'])); await b; });
    const data = useFullscreenFeedStore.getState().galleryData;
    await act(async () => { f.resolves[0](rows(['z', 'a', 'b'])); await a; });
    expect(useFullscreenFeedStore.getState()).toMatchObject({ mediaId: 'b', activePagerIdx: 1 });
    expect(useFullscreenFeedStore.getState().galleryData).toBe(data);
  });
});
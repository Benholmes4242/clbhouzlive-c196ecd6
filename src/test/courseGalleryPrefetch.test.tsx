import { describe, expect, it, vi, beforeEach } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import type { FeedPost } from '@/components/media-system/types/media';
import { useFullscreenFeedStore } from '@/store/fullscreenFeedStore';
import { filteredGallery } from '@/lib/courseMedia/courseGallery';

const f = vi.hoisted(() => ({ resolve: null as null | ((rows: unknown[]) => void), calls: 0, opened: [] as unknown[] }));
vi.mock('@/context/ActiveActorContext', () => ({ useActiveActor: () => ({ activeActor: { type: 'personal', id: 'me' } }) }));
vi.mock('@/utils/analyticsEvents', () => ({ analyticsEvents: { track: vi.fn() } }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { rpc: () => { f.calls++; return new Promise(resolve => { f.resolve = rows => resolve({ data: rows, error: null }); }); } } }));
vi.mock('@/components/media-system/utils/feedMapper', () => ({ mapRowToFeedPost: (row: { post_id: string; id: string }) => post(row.id) }));
vi.mock('@/lib/openWithOrigin', () => ({ openWithOrigin: (args: { posts: FeedPost[]; mediaId: string; options: Record<string, unknown> }) => {
  f.opened.push(args);
  const media = args.posts[0].mediaItems;
  useFullscreenFeedStore.setState({ isOpen: true, posts: args.posts, ...args.options, mediaId: args.mediaId, activePagerIdx: Math.max(0, media.findIndex(m => m.id === args.mediaId)) });
} }));
import { useCourseGallery } from '@/components/course-media-tab/hooks/useCourseGallery';

function post(id: string): FeedPost {
  return { id: `post-${id}`, userId: 'me', actorId: 'me', actorType: 'personal', displayName: 'Thomas Holmes', avatarUrl: '', username: '', isVerified: false, creatorRelation: 'none', caption: '', createdAt: '2026-01-01T00:00:00Z', mediaItems: [{ id, type: 'image', imageUrl: `/${id}.jpg`, width: 1000, height: 1000 }], likeCount: 0, commentCount: 0, shareCount: 0, review: null, isReview: false, isLikedByMe: false, isFollowedByMe: false };
}
const setup = () => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const wrapper = ({ children }: { children: ReactNode }) => <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  return renderHook(() => useCourseGallery({ courseId: 'course', courseName: 'Course', userId: 'me', holes: [], scored: false, holeTags: [], placeTags: [], pagePosts: [post('a'), post('b')], tagsReady: true }), { wrapper });
};
beforeEach(() => { f.resolve = null; f.calls = 0; f.opened = []; useFullscreenFeedStore.setState({ isOpen: false, courseGallery: null, galleryData: null }); });

describe('course gallery prefetch', () => {
  it('starts building on mount, before any tap', async () => {
    setup();
    await waitFor(() => expect(f.calls).toBe(1));
  });
  it('a tap opens at once from page shots, then hydrates keeping the current shot', async () => {
    const hook = setup();
    await waitFor(() => expect(f.calls).toBe(1));
    let pending: Promise<void> | undefined;
    act(() => { pending = hook.result.current('all', 'b', null, 'everything'); });
    expect(f.opened).toHaveLength(1);
    expect(useFullscreenFeedStore.getState().mediaId).toBe('b');
    await act(async () => { f.resolve?.([{ id: 'z', post_id: 'pz' }, { id: 'a', post_id: 'pa' }, { id: 'b', post_id: 'pb' }]); await pending; });
    const state = useFullscreenFeedStore.getState();
    expect(filteredGallery(state.galleryData?.shots ?? [], 'all').map(s => s.id)).toEqual(['z', 'a', 'b']);
    expect(state.mediaId).toBe('b');
    expect(state.activePagerIdx).toBe(2);
    expect(f.opened).toHaveLength(1);
  });
});

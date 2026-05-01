import { create } from 'zustand';
import type { FeedPost } from '@/components/media-system/types/media';
import { engagementBus } from '@/lib/engagementBus';
import { applyEngagementDelta } from '@/lib/applyEngagementDelta';

interface OpenOptions {
  openCommentsInitially?: boolean;
  /** Called when the overlay close button is tapped. Use for deep-link routes
   *  that need to navigate back instead of just hiding the overlay. */
  onClose?: () => void;
  /** Pagination handoff — opener (typically a grid that owns the data hook)
   *  passes its current pagination signals so the overlay can ask for more
   *  pages as the user nears the end of the loaded set. Optional; surfaces
   *  that don't paginate fall through to `hasNextPage: false` (no behaviour
   *  change). Keep these in sync over time via `setPaginationState`. */
  hasNextPage?: boolean;
  fetchNextPage?: () => void;
  isFetchingNextPage?: boolean;
}

interface FullscreenFeedState {
  isOpen: boolean;
  posts: FeedPost[];
  startIndex: number;
  activeIndex: number;
  openCommentsInitially: boolean;
  onCloseCallback: (() => void) | null;
  // Pagination — owned by the opener, mirrored in this store so the overlay
  // can read them reactively without holding a hook reference.
  hasNextPage: boolean;
  fetchNextPage: (() => void) | null;
  isFetchingNextPage: boolean;
  open: (posts: FeedPost[], startIndex?: number, options?: OpenOptions) => void;
  close: () => void;
  appendPosts: (newPosts: FeedPost[]) => void;
  setActiveIndex: (idx: number) => void;
  consumeOpenCommentsInitially: () => void;
  /** Allow openers to push updated pagination state into the store as the
   *  underlying query progresses (e.g. hasNextPage flips false on last page,
   *  isFetchingNextPage toggles during a fetch). */
  setPaginationState: (state: { hasNextPage: boolean; isFetchingNextPage: boolean }) => void;
}

export const useFullscreenFeedStore = create<FullscreenFeedState>((set, get) => ({
  isOpen: false,
  posts: [],
  startIndex: 0,
  activeIndex: 0,
  openCommentsInitially: false,
  onCloseCallback: null,
  hasNextPage: false,
  fetchNextPage: null,
  isFetchingNextPage: false,
  open: (posts, startIndex = 0, options) =>
    set({
      isOpen: true,
      posts,
      startIndex,
      activeIndex: startIndex,
      openCommentsInitially: !!options?.openCommentsInitially,
      onCloseCallback: options?.onClose ?? null,
      hasNextPage: options?.hasNextPage ?? false,
      fetchNextPage: options?.fetchNextPage ?? null,
      isFetchingNextPage: options?.isFetchingNextPage ?? false,
    }),
  close: () => {
    const cb = get().onCloseCallback;
    set({
      isOpen: false,
      posts: [],
      activeIndex: 0,
      openCommentsInitially: false,
      onCloseCallback: null,
      hasNextPage: false,
      fetchNextPage: null,
      isFetchingNextPage: false,
    });
    if (cb) {
      try { cb(); } catch {}
    }
  },
  appendPosts: (newPosts) =>
    set((s) => ({ posts: [...s.posts, ...newPosts.filter(p => !s.posts.find(e => e.id === p.id))] })),
  setActiveIndex: (idx) => set({ activeIndex: idx }),
  consumeOpenCommentsInitially: () => set({ openCommentsInitially: false }),
  setPaginationState: ({ hasNextPage, isFetchingNextPage }) =>
    set({ hasNextPage, isFetchingNextPage }),
}));

// Subscribe to engagement updates from the rest of the app. Keeps the
// fullscreen snapshot in sync with React Query caches that are patched
// by `patchEngagement`. No-op when the overlay isn't open.
engagementBus.on(({ postId, delta }) => {
  const state = useFullscreenFeedStore.getState();
  if (!state.isOpen) return;
  if (!state.posts.some((p) => p.id === postId)) return;

  useFullscreenFeedStore.setState({
    posts: state.posts.map((p) => applyEngagementDelta(p, postId, delta)),
  });
});

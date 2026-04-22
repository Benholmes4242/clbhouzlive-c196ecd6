import { create } from 'zustand';
import type { FeedPost } from '@/components/media-system/types/media';

interface OpenOptions {
  openCommentsInitially?: boolean;
  /** Called when the overlay close button is tapped. Use for deep-link routes
   *  that need to navigate back instead of just hiding the overlay. */
  onClose?: () => void;
}

interface FullscreenFeedState {
  isOpen: boolean;
  posts: FeedPost[];
  startIndex: number;
  activeIndex: number;
  openCommentsInitially: boolean;
  onCloseCallback: (() => void) | null;
  open: (posts: FeedPost[], startIndex?: number, options?: OpenOptions) => void;
  close: () => void;
  appendPosts: (newPosts: FeedPost[]) => void;
  setActiveIndex: (idx: number) => void;
  consumeOpenCommentsInitially: () => void;
}

export const useFullscreenFeedStore = create<FullscreenFeedState>((set, get) => ({
  isOpen: false,
  posts: [],
  startIndex: 0,
  activeIndex: 0,
  openCommentsInitially: false,
  onCloseCallback: null,
  open: (posts, startIndex = 0, options) =>
    set({
      isOpen: true,
      posts,
      startIndex,
      activeIndex: startIndex,
      openCommentsInitially: !!options?.openCommentsInitially,
      onCloseCallback: options?.onClose ?? null,
    }),
  close: () => {
    const cb = get().onCloseCallback;
    set({
      isOpen: false,
      posts: [],
      activeIndex: 0,
      openCommentsInitially: false,
      onCloseCallback: null,
    });
    if (cb) {
      try { cb(); } catch {}
    }
  },
  appendPosts: (newPosts) =>
    set((s) => ({ posts: [...s.posts, ...newPosts.filter(p => !s.posts.find(e => e.id === p.id))] })),
  setActiveIndex: (idx) => set({ activeIndex: idx }),
  consumeOpenCommentsInitially: () => set({ openCommentsInitially: false }),
}));

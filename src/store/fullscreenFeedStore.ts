import { create } from 'zustand';
import type { FeedPost } from '@/components/media-system/types/media';

interface FullscreenFeedState {
  isOpen: boolean;
  posts: FeedPost[];
  startIndex: number;
  activeIndex: number;
  closeCount: number;
  open: (posts: FeedPost[], startIndex?: number) => void;
  close: () => void;
  appendPosts: (newPosts: FeedPost[]) => void;
  setActiveIndex: (idx: number) => void;
}

export const useFullscreenFeedStore = create<FullscreenFeedState>((set, get) => ({
  isOpen: false,
  posts: [],
  startIndex: 0,
  activeIndex: 0,
  closeCount: 0,
  open: (posts, startIndex = 0) =>
    set({ isOpen: true, posts, startIndex, activeIndex: startIndex }),
  close: () => set({ isOpen: false, posts: [], activeIndex: 0, closeCount: get().closeCount + 1 }),
  appendPosts: (newPosts) =>
    set((s) => ({ posts: [...s.posts, ...newPosts.filter(p => !s.posts.find(e => e.id === p.id))] })),
  setActiveIndex: (idx) => set({ activeIndex: idx }),
}));

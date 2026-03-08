import { create } from 'zustand';
import type { FeedPost } from '@/components/media-system/types/media';

interface FullscreenFeedState {
  isOpen: boolean;
  posts: FeedPost[];
  startIndex: number;
  sourceId: string;

  open: (params: { posts: FeedPost[]; startIndex: number; sourceId: string }) => void;
  close: () => void;
}

export const useFullscreenFeed = create<FullscreenFeedState>((set) => ({
  isOpen: false,
  posts: [],
  startIndex: 0,
  sourceId: '',

  open: ({ posts, startIndex, sourceId }) =>
    set({ isOpen: true, posts, startIndex, sourceId }),
  close: () =>
    set({ isOpen: false, posts: [], startIndex: 0, sourceId: '' }),
}));

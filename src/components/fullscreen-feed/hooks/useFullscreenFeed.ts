import { create } from 'zustand';
import type { FeedPost } from '@/components/media-system/types/media';

interface FullscreenFeedState {
  isOpen: boolean;
  posts: FeedPost[];
  startIndex: number;
  sourceId: string;
  fetchNextPage?: () => void;
  hasNextPage?: boolean;
  isFetchingNextPage?: boolean;

  open: (params: {
    posts: FeedPost[];
    startIndex: number;
    sourceId: string;
    fetchNextPage?: () => void;
    hasNextPage?: boolean;
    isFetchingNextPage?: boolean;
  }) => void;
  appendPosts: (newPosts: FeedPost[]) => void;
  close: () => void;
}

export const useFullscreenFeed = create<FullscreenFeedState>((set) => ({
  isOpen: false,
  posts: [],
  startIndex: 0,
  sourceId: '',
  fetchNextPage: undefined,
  hasNextPage: undefined,
  isFetchingNextPage: undefined,

  open: ({ posts, startIndex, sourceId, fetchNextPage, hasNextPage, isFetchingNextPage }) =>
    set({
      isOpen: true,
      posts,
      startIndex,
      sourceId,
      fetchNextPage,
      hasNextPage,
      isFetchingNextPage,
    }),
  appendPosts: (newPosts) =>
    set((state) => ({ posts: [...state.posts, ...newPosts] })),
  close: () =>
    set({
      isOpen: false,
      posts: [],
      startIndex: 0,
      sourceId: '',
      fetchNextPage: undefined,
      hasNextPage: undefined,
      isFetchingNextPage: undefined,
    }),
}));

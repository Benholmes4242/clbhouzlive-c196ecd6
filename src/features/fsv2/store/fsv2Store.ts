/**
 * fsv2Store — the V2 fullscreen viewer's single source of truth.
 *
 * Not related to `src/store/fullscreenFeedStore.ts` in any way. Separate
 * module, separate lifecycle, no borrow, no FLIP.
 *
 * `open()` accepts the v1 OpenOptions shape so callers pass an identical
 * object shape (see types.ts). `openedFrom` is REQUIRED; a dev-warn refuses
 * tagless opens. `activePagerIdx` is the single source of truth for
 * carousel dots (v1 defect 6: dots read from THIS store, never lagging
 * external state).
 */

import { create } from 'zustand';

import type { FeedPost } from '@/components/media-system/types/media';

import type { Fsv2OpenOptions } from '../types';
import { genOpenId } from '../perf/trace';

interface Fsv2State {
  isOpen: boolean;
  openId: string;
  openedFrom: string | null;

  posts: FeedPost[];
  activeIndex: number;
  activePagerIdx: number;

  startPosition: number;

  // Phase-2 fields (stored, not read yet)
  onCloseCb: (() => void) | null;
  openCommentsInitially: boolean;
  initialCommentId: string | null;
  hasNextPage: boolean;
  fetchNextPage: (() => void) | null;
  isFetchingNextPage: boolean;
  readOnly: boolean;

  open: (opts: Fsv2OpenOptions) => void;
  close: () => void;
  setActiveIndex: (i: number) => void;
  setActivePagerIdx: (i: number) => void;
  /** Replace a post in place — used by the engagement bridge. */
  patchPost: (postId: string, patcher: (p: FeedPost) => FeedPost) => void;
}

function resolveMediaIndex(
  post: FeedPost | undefined,
  mediaIndex: number | undefined,
  mediaId: string | null | undefined,
): number {
  if (!post) return 0;
  if (mediaId) {
    const found = post.mediaItems.findIndex((m) => m.id === mediaId);
    if (found >= 0) return found;
  }
  if (typeof mediaIndex === 'number' && mediaIndex >= 0) {
    return Math.min(mediaIndex, Math.max(0, post.mediaItems.length - 1));
  }
  return 0;
}

export const useFsv2Store = create<Fsv2State>((set, get) => ({
  isOpen: false,
  openId: '',
  openedFrom: null,

  posts: [],
  activeIndex: 0,
  activePagerIdx: 0,

  startPosition: 0,

  onCloseCb: null,
  openCommentsInitially: false,
  initialCommentId: null,
  hasNextPage: false,
  fetchNextPage: null,
  isFetchingNextPage: false,
  readOnly: false,

  open: (opts: Fsv2OpenOptions) => {
    if (!opts.openedFrom) {
      if (import.meta.env.DEV) {
        // eslint-disable-next-line no-console
        console.warn('[fsv2] open() refused: openedFrom is required.');
      }
      return;
    }
    if (!opts.posts || opts.posts.length === 0) {
      if (import.meta.env.DEV) {
        // eslint-disable-next-line no-console
        console.warn('[fsv2] open() refused: empty posts array.');
      }
      return;
    }

    const startIndex = Math.max(
      0,
      Math.min(opts.startIndex ?? 0, opts.posts.length - 1),
    );
    const startPost = opts.posts[startIndex];
    const activePagerIdx = resolveMediaIndex(
      startPost,
      opts.mediaIndex,
      opts.mediaId,
    );

    set({
      isOpen: true,
      openId: genOpenId(),
      openedFrom: opts.openedFrom,
      posts: opts.posts,
      activeIndex: startIndex,
      activePagerIdx,
      startPosition: opts.startPosition ?? 0,
      onCloseCb: opts.onClose ?? null,
      openCommentsInitially: !!opts.openCommentsInitially,
      initialCommentId: opts.initialCommentId ?? null,
      hasNextPage: !!opts.hasNextPage,
      fetchNextPage: opts.fetchNextPage ?? null,
      isFetchingNextPage: !!opts.isFetchingNextPage,
      readOnly: !!opts.readOnly,
    });
  },

  close: () => {
    const cb = get().onCloseCb;
    set({
      isOpen: false,
      posts: [],
      activeIndex: 0,
      activePagerIdx: 0,
      startPosition: 0,
      onCloseCb: null,
      openCommentsInitially: false,
      initialCommentId: null,
      hasNextPage: false,
      fetchNextPage: null,
      isFetchingNextPage: false,
      readOnly: false,
    });
    if (cb) {
      try { cb(); } catch { /* swallow — callback owns its errors */ }
    }
  },

  setActiveIndex: (i: number) => {
    const { posts, activeIndex } = get();
    if (i === activeIndex) return;
    const clamped = Math.max(0, Math.min(i, posts.length - 1));
    set({ activeIndex: clamped, activePagerIdx: 0 });
  },

  setActivePagerIdx: (i: number) => {
    if (i === get().activePagerIdx) return;
    set({ activePagerIdx: Math.max(0, i) });
  },

  patchPost: (postId, patcher) => {
    const { posts } = get();
    let dirty = false;
    const next = posts.map((p) => {
      if (p.id !== postId) return p;
      const patched = patcher(p);
      if (patched !== p) dirty = true;
      return patched;
    });
    if (dirty) set({ posts: next });
  },
}));

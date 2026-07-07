import { create } from 'zustand';
import type { FeedPost } from '@/components/media-system/types/media';
import { engagementBus } from '@/lib/engagementBus';
import { applyEngagementDelta } from '@/lib/applyEngagementDelta';
import type { LaneId } from '@/video/lanePolicy';
import { vperfStart, vperfMark, vperfArmLane, vperfNextId } from '@/perf/vperf';



export interface OpenOrigin {
  rect: { top: number; left: number; width: number; height: number };
  posterUrl: string | null;
  borderRadius: string;
  aspectRatio: number;
  /** Intrinsic natural dimensions of the tapped media, threaded from the
   *  post's mediaItems. Preferred over `aspectRatio` (tile proxy) because
   *  grid tiles are uniform and cover-crop — the tile aspect is not a
   *  faithful proxy for the media on grids. `0`/missing → fall back to
   *  `aspectRatio`. */
  originMediaW?: number;
  originMediaH?: number;
  /** Media kind of the tapped item. Required so the overlay clone consults
   *  resolveRestingRect with the correct branch (portrait video → cover,
   *  landscape video → contain, image → contain). Falls back to `'image'`
   *  when omitted for backward compat with legacy openers. */
  mediaType?: 'video' | 'image';
}

/**
 * Stage-7 PR-1 borrow descriptor. Present when the fullscreen viewer opened
 * over a live rail-pool lane and is re-parenting that live element into the
 * opening slide (no fullscreen-lane load for the opening slide).
 */
export interface BorrowDescriptor {
  laneId: LaneId;
  ownerKey: string;
  postId: string;
  posterUrl: string | null;
  /** Cached viewport at borrow time — used on close to detect orientation
   *  change (fallback path). */
  viewportW: number;
  viewportH: number;
  /** Stage-7 PR-2: pre-borrow mute state (feed-active only). Rail borrows
   *  omit this — returnBorrow forces mute for rails. Feed-active restores
   *  this on return so an unmuted card stays unmuted after close. */
  wasMuted?: boolean;
}

interface OpenOptions {
  openCommentsInitially?: boolean;
  /** Origin geometry for the FLIP tile→viewer expand transition. When
   *  omitted (deep-link / notification), the overlay falls back to a plain
   *  opacity fade. */
  origin?: OpenOrigin | null;
  /** Optional comment id to highlight/scroll-to once the comments sheet opens
   *  (used by notification deep-links to a specific comment). */
  initialCommentId?: string | null;
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
  /** Read-only / gallery mode: hides like/comment/share/follow chrome.
   *  Used by course-detail media entry points. Defaults false so Clubhouse
   *  and deep-link openers keep social actions. */
  readOnly?: boolean;
  /** Two-way resume: seconds to seek fullscreen lane to on first paint. */
  startPosition?: number;
  /** Positional media index within the opening post. Kept as a cheap
   *  fallback — `mediaId` (below) is authoritative because groupMultiMedia
   *  re-sorts / dedupes / filters mediaItems, so positional indices from
   *  ungrouped callers won't survive the grouping step. */
  mediaIndex?: number;
  /** Stable media item id used to pick which media within the opening post
   *  the opening slide should render. Resolves via
   *  `post.mediaItems.findIndex(m => m.id === mediaId)` on the opening slide;
   *  falls back to `mediaIndex` (default 0) if the id can't be found. */
  mediaId?: string | null;
  /** Surface tag that opened the viewer. Gate append/pagination effects with
   *  `useIsViewerOwnedBy(surface)` so background surfaces don't leak their
   *  posts into a viewer another surface opened. */
  openedFrom?: string | null;
  /** Stage-7 PR-1: live rail-lane borrow descriptor. Present only when the
   *  tapped tile was actively playing a rail lane. FullscreenVideoSlot on the
   *  opening slide takes the borrow branch (re-parents the live element)
   *  instead of loading the 'fullscreen' lane. */
  borrow?: BorrowDescriptor | null;
}


interface FullscreenFeedState {
  isOpen: boolean;
  posts: FeedPost[];
  startIndex: number;
  activeIndex: number;
  openCommentsInitially: boolean;
  initialCommentId: string | null;
  onCloseCallback: (() => void) | null;
  // Pagination — owned by the opener, mirrored in this store so the overlay
  // can read them reactively without holding a hook reference.
  hasNextPage: boolean;
  fetchNextPage: (() => void) | null;
  isFetchingNextPage: boolean;
  readOnly: boolean;
  origin: OpenOrigin | null;
  startPosition: number;
  mediaIndex: number;
  mediaId: string | null;
  openedFrom: string | null;
  borrow: BorrowDescriptor | null;
  /** Stage-7 PR-3: one-shot flag set by the in-fullscreen media pager the
   *  first time the user swipes horizontally away from the opening media on
   *  the borrow slide. The overlay's dedicated effect consumes it and runs
   *  the standard returnBorrow('demote') path — no engine/pool call is made
   *  from FeedSlide itself. */
  borrowDemoteRequested: boolean;

  open: (posts: FeedPost[], startIndex?: number, options?: OpenOptions) => void;
  close: () => void;
  appendPosts: (newPosts: FeedPost[]) => void;
  setActiveIndex: (idx: number) => void;
  consumeOpenCommentsInitially: () => void;
  consumeInitialCommentId: () => void;
  /** Clear the borrow descriptor once the overlay has handed the element
   *  back / demoted it. Non-borrow callers never invoke this. */
  clearBorrow: () => void;
  /** Stage-7 PR-3: pager-triggered borrow demote. No-op when no borrow is
   *  live. The overlay effect handles the actual returnBorrow call. */
  demoteBorrow: () => void;
  consumeBorrowDemoteRequested: () => void;
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
  initialCommentId: null,
  onCloseCallback: null,
  hasNextPage: false,
  fetchNextPage: null,
  isFetchingNextPage: false,
  readOnly: false,
  origin: null,
  startPosition: 0,
  mediaIndex: 0,
  mediaId: null,
  openedFrom: null,
  borrow: null,
  borrowDemoteRequested: false,

  open: (posts, startIndex = 0, options) => {
    set({
      isOpen: true,
      posts,
      startIndex,
      activeIndex: startIndex,
      openCommentsInitially: !!options?.openCommentsInitially,
      initialCommentId: options?.initialCommentId ?? null,
      onCloseCallback: options?.onClose ?? null,
      hasNextPage: options?.hasNextPage ?? false,
      fetchNextPage: options?.fetchNextPage ?? null,
      isFetchingNextPage: options?.isFetchingNextPage ?? false,
      readOnly: !!options?.readOnly,
      origin: options?.origin ?? null,
      startPosition: options?.startPosition ?? 0,
      mediaIndex: options?.mediaIndex ?? 0,
      mediaId: options?.mediaId ?? null,
      openedFrom: options?.openedFrom ?? null,
      borrow: options?.borrow ?? null,
      borrowDemoteRequested: false,
    });
  },
  close: () => {
    const cb = get().onCloseCallback;
    const borrow = get().borrow;
    // [VPERF] S2 fs.close — from close intent to tileLive.
    // borrow  → tile element re-mounted + playing on its rail lane
    // no-borrow → overlay unmounted (approximated as fullscreen lane 'paused')
    const mode: 'flip-return' | 'no-borrow' | 'fallback' = borrow ? 'flip-return' : 'no-borrow';
    const closeSpanId = vperfNextId('fs.close');
    vperfStart(closeSpanId, 'fs.close', { mode, laneId: borrow ? borrow.laneId : 'fullscreen' });
    vperfMark(closeSpanId, 'returnStart');
    if (borrow) {
      vperfArmLane(borrow.laneId, { spanId: closeSpanId, endOn: 'playing' });
    } else {
      // Fallback: no borrow — end on fullscreen lane going idle. We don't
      // have an 'unmount' event, so end on next lane state edge that fires
      // after close: canplay/playing/waiting/seeked all viable, but the most
      // reliable is the release-driven session end. For now end on the next
      // 'firstFrame' of any subsequent open (won't fire on this close) —
      // instead close manually after one frame.
      requestAnimationFrame(() => {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        import('@/perf/vperf').then((m) => m.vperfEnd(closeSpanId, { note: 'no-borrow raf' })).catch(() => {});
      });
    }
    set({
      isOpen: false,
      posts: [],
      activeIndex: 0,
      openCommentsInitially: false,
      initialCommentId: null,
      onCloseCallback: null,
      hasNextPage: false,
      fetchNextPage: null,
      isFetchingNextPage: false,
      readOnly: false,
      origin: null,
      startPosition: 0,
      mediaIndex: 0,
      mediaId: null,
      openedFrom: null,
      borrow: null,
      borrowDemoteRequested: false,
    });
    if (cb) {
      try { cb(); } catch {}
    }
  },
  clearBorrow: () => set({ borrow: null }),
  demoteBorrow: () => {
    if (!get().borrow) return;
    if (get().borrowDemoteRequested) return;
    set({ borrowDemoteRequested: true });
  },
  consumeBorrowDemoteRequested: () => set({ borrowDemoteRequested: false }),
  appendPosts: (newPosts) => {
    set((s) => {
      const existing = new Set(s.posts.map((p) => p.id));
      const additions = newPosts.filter((p) => !existing.has(p.id));
      if (additions.length === 0) return s;
      return { posts: [...s.posts, ...additions] };
    });
  },

  setActiveIndex: (idx) => {
    const prev = get().activeIndex;
    if (prev === idx) return;
    set({ activeIndex: idx });
  },
  consumeOpenCommentsInitially: () => set({ openCommentsInitially: false }),
  consumeInitialCommentId: () => set({ initialCommentId: null }),
  setPaginationState: ({ hasNextPage, isFetchingNextPage }) => {
    const s = get();
    if (s.hasNextPage === hasNextPage && s.isFetchingNextPage === isFetchingNextPage) return;
    set({ hasNextPage, isFetchingNextPage });
  },
}));

/**
 * True only when the viewer is open AND was opened from `surface`.
 * Use to gate append/pagination effects.
 */
export function useIsViewerOwnedBy(surface: string): boolean {
  const isOpen = useFullscreenFeedStore((s) => s.isOpen);
  const openedFrom = useFullscreenFeedStore((s) => s.openedFrom);
  return isOpen && openedFrom === surface;
}



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

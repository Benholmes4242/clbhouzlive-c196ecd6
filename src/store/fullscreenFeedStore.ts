import { create } from 'zustand';
import type { FeedPost } from '@/components/media-system/types/media';
import { engagementBus } from '@/lib/engagementBus';
import { applyEngagementDelta } from '@/lib/applyEngagementDelta';
import type { LaneId } from '@/video/lanePolicy';
import { vperfStart, vperfMark, vperfArmLane, vperfNextId, vperfCloseMotionTrace, vperfCloseMotionMark } from '@/perf/vperf';
import { trace, traceLookup } from '@/perf/trace';
import * as audioDbg from '@/perf/audioDebug';
import { useSessionAudio, getLastUnmuteGestureTs } from '@/audio/sessionAudioStore';
import { VideoEngine } from '@/video/VideoEngine';
import { originHostRegistry } from '@/video/originHostRegistry';
import { setLastCloseSnapshot } from '@/perf/positionContinuity';

/**
 * The fullscreen viewer paints media and nothing else. A post with an empty or
 * absent `mediaItems` renders a black slide under live chrome, which reads as
 * broken. This is the ONLY exclusion condition — never post type, notability
 * or the presence of an attached round.
 */
const hasMedia = (p: FeedPost | undefined | null): boolean =>
  !!p && Array.isArray(p.mediaItems) && p.mediaItems.length > 0;



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
  /** B2: pre-borrow mute snapshot retired — the session store is now the
   *  single source of truth for restore-time mute (see returnBorrow). */
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

  /** Symmetric close animation orchestration.
   *  'idle'      — no close in flight (or non-animated instant close).
   *  'borrow'    — BorrowedFullscreenSlot should reverse-shrink to its origin
   *                tile. On transitionend it flips `closeAnimDone` and the
   *                overlay runs returnBorrow('close') + finalize.
   *  'nonborrow' — overlay owns a reverse clone (poster shrinks resting→tile);
   *                on transitionend it finalises.
   *  Demote/route/target-gone closes bypass this entirely (stay 'idle'). */
  closeAnim: 'idle' | 'borrow' | 'nonborrow';
  closeAnimDone: boolean;

  /** Fullscreen media pager active-page index. Written by
   *  <FullscreenMediaPager/> on mount + on scroll-snap settle. Consumed by
   *  <FullscreenScrubber/> to derive the correct expectedOwnerKey per page
   *  (broken previously — clubhouseStore.carouselPositions was consulted). */
  activePagerIdx: number;
  setActivePagerIdx: (idx: number) => void;

  /** Session-scoped viewer pause intent — ownerKeys the user actively paused
   *  from the scrubber. While a key is here, fullscreen slots for that media
   *  MUST skip their default auto-play on mount/remount. Cleared on close. */
  pausedOwnerKeys: Set<string>;
  addPausedOwnerKey: (k: string) => void;
  removePausedOwnerKey: (k: string) => void;

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
  /** Signal that the reverse close animation has just kicked off. */
  beginCloseAnim: (kind: 'borrow' | 'nonborrow') => void;
  /** Fired by the animating surface at transitionend (or watchdog). Overlay
   *  observes and runs the finalization tail. */
  signalCloseAnimDone: () => void;
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
  closeAnim: 'idle',
  closeAnimDone: false,
  activePagerIdx: 0,
  pausedOwnerKeys: new Set<string>(),

  setActivePagerIdx: (idx) => {
    if (get().activePagerIdx === idx) return;
    set({ activePagerIdx: idx });
  },
  addPausedOwnerKey: (k) => {
    const cur = get().pausedOwnerKeys;
    if (cur.has(k)) return;
    const next = new Set(cur);
    next.add(k);
    set({ pausedOwnerKeys: next });
  },
  removePausedOwnerKey: (k) => {
    const cur = get().pausedOwnerKeys;
    if (!cur.has(k)) return;
    const next = new Set(cur);
    next.delete(k);
    set({ pausedOwnerKeys: next });
  },


  open: (rawPosts, startIndex = 0, options) => {
    // ── Media-less posts must never reach the viewer: they have nothing to
    // paint, so the slide renders black under a full chrome/action rail.
    // Filter on media presence ONLY (never post type) — a round post with
    // composer-attached photos HAS media and stays swipeable.
    // Resolve the tapped post by identity BEFORE filtering, then remap.
    const intended: FeedPost | undefined = rawPosts[startIndex];
    if (!hasMedia(intended)) return; // never fall back to index 0
    const posts = rawPosts.filter(hasMedia);
    startIndex = Math.max(0, posts.findIndex((p) => p.id === intended!.id));

    const openingPost: any = posts[startIndex];
    const slidePostId: string | null = openingPost?.id ?? null;

    const openT = traceLookup({ postId: slidePostId });
    trace('store.open', {
      openId: openT?.openId,
      slidePostId,
      slideOwnerKey: slidePostId ? `${slidePostId}:${options?.mediaIndex ?? 0}` : null,
      mediaIndex: options?.mediaIndex ?? 0,
      mediaId: options?.mediaId ?? null,
      isBorrow: !!options?.borrow,
      startPosition: options?.startPosition ?? 0,
      openedFrom: options?.openedFrom ?? null,
    });
    // ── AudioDebug: tap → open cycle instrumentation (flag-gated, zero-cost off)
    if (audioDbg.audioDebugEnabled()) {
      try {
        const ownerKey = options?.borrow?.ownerKey
          ?? (slidePostId ? `${slidePostId}:${options?.mediaIndex ?? 0}` : null);
        const openId = audioDbg.beginOpen(slidePostId ?? undefined);
        const s = useSessionAudio.getState();
        const lastTs = getLastUnmuteGestureTs();
        audioDbg.logAudio('tap', {
          slidePostId, ownerKey, openId,
          openedFrom: options?.openedFrom ?? null,
        });
        audioDbg.logAudio('session.state', {
          isMuted: s.isMuted,
          lastUnmuteGestureTs: lastTs,
          msSinceGesture: lastTs > 0 ? Date.now() - lastTs : null,
        });
        if (options?.borrow) {
          const laneId = options.borrow.laneId;
          const el = (VideoEngine as unknown as { _debugGetElement?: (id: string) => HTMLMediaElement | null })._debugGetElement?.(laneId) ?? null;
          const snap = VideoEngine.snapshot(laneId as LaneId);
          audioDbg.logAudio('tile.state', {
            laneId, ownerKey: options.borrow.ownerKey,
            muted: el?.muted ?? null, volume: el?.volume ?? null,
            paused: el?.paused ?? null,
            currentTime: +(el?.currentTime ?? snap.currentTime).toFixed(3),
            state: snap.state,
          });
          audioDbg.setSummary({ tilePos: +(el?.currentTime ?? snap.currentTime).toFixed(2) });
        } else if (ownerKey) {
          const lastPos = VideoEngine.getLastPos(ownerKey);
          audioDbg.logAudio('tile.state', { laneId: null, ownerKey, lastPos: +lastPos.toFixed(3) });
          audioDbg.setSummary({ tilePos: +lastPos.toFixed(2) });
        }
        audioDbg.logAudio('open.decision', {
          mode: options?.borrow ? 'borrow' : 'cold',
          laneId: options?.borrow?.laneId ?? 'fullscreen',
          startPosition: +Number(options?.startPosition ?? 0).toFixed(3),
          lastPos: ownerKey ? +VideoEngine.getLastPos(ownerKey).toFixed(3) : null,
        });
        audioDbg.setSummary({
          mode: options?.borrow ? 'borrow' : 'cold',
          laneId: options?.borrow?.laneId ?? 'fullscreen',
          sessionMuted: s.isMuted,
          msSinceGesture: lastTs > 0 ? Date.now() - lastTs : null,
          continuityOk: null,
          fsPos: null,
        });
      } catch {}
    }
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
      activePagerIdx: options?.mediaIndex ?? 0,
      pausedOwnerKeys: new Set<string>(),
    });

  },
  close: () => {
    const cb = get().onCloseCallback;
    const borrow = get().borrow;
    // Close-transition fix: freeze lastPos to the element's true fs playback
    // position BEFORE any handback / lane teardown runs. Cold resumes elsewhere
    // (fresh rail acquires, feed re-enters) then see the fresh value; and for
    // same-element borrow returns the target/now delta collapses so no seek
    // fires even if the sameElementReturn hint is bypassed.
    try {
      VideoEngine.captureLastPos(borrow ? borrow.laneId : 'fullscreen');
    } catch {}
    // [VPERF] S2 fs.close — from close intent to tileLive.
    // borrow  → tile element re-mounted + playing on its rail lane
    // no-borrow → overlay unmounted (approximated as fullscreen lane 'paused')
    const mode: 'flip-return' | 'no-borrow' | 'fallback' = borrow ? 'flip-return' : 'no-borrow';
    const closeSpanId = vperfNextId('fs.close');
    vperfStart(closeSpanId, 'fs.close', {
      mode,
      hadBorrow: !!borrow,
      laneId: borrow ? borrow.laneId : 'fullscreen',
    });
    vperfMark(closeSpanId, 'closeIntent');
    // [VPERF] fs.close.motion — mirror of fs.open.motion for the return
    // animation. Live-resolves the origin tile rect each frame via
    // originHostRegistry so a mid-flight tile shift shows up as a delta
    // between wrapper.rect and tileLive.rect at that frame.
    try {
      const ownerKey = borrow?.ownerKey ?? null;
      vperfCloseMotionTrace(closeSpanId, {
        originResolver: ownerKey
          ? () => {
              const host = originHostRegistry.get(ownerKey);
              if (!host) return null;
              const r = host.getBoundingClientRect();
              return { top: r.top, left: r.left, width: r.width, height: r.height };
            }
          : null,
      });
      vperfCloseMotionMark('closeRequested', { hadBorrow: !!borrow, ownerKey });
    } catch {}
    // ── AudioDebug: close.state + close.position + tile.resume @500ms (flag-gated)
    if (audioDbg.audioDebugEnabled()) {
      try {
        const laneId = borrow ? borrow.laneId : 'fullscreen';
        const el = (VideoEngine as unknown as { _debugGetElement?: (id: string) => HTMLMediaElement | null })._debugGetElement?.(laneId) ?? null;
        const sess = useSessionAudio.getState();
        audioDbg.logAudio('close.state', {
          laneId, mode: borrow ? 'borrow-return' : 'no-borrow',
          sessionMuted: sess.isMuted,
          elMuted: el?.muted ?? null, elVolume: el?.volume ?? null,
          elPaused: el?.paused ?? null,
          elCurrentTime: el ? +el.currentTime.toFixed(3) : null,
        });
        // close.position — dedicated beat isolating fs playback position at
        // close intent; the resume beat later diffs against this.
        audioDbg.logAudio('close.position', {
          laneId,
          fsCurrentTime: el ? +el.currentTime.toFixed(3) : null,
          fsPaused: el?.paused ?? null,
        });
        setLastCloseSnapshot({
          laneId,
          ownerKey: borrow?.ownerKey ?? null,
          fsCurrentTime: el ? +el.currentTime.toFixed(3) : null,
          fsPaused: el?.paused ?? null,
          closeTs: performance.now(),
        });
        const resumeKey = borrow?.ownerKey ?? null;
        setTimeout(() => {
          try {
            const el2 = (VideoEngine as unknown as { _debugGetElement?: (id: string) => HTMLMediaElement | null })._debugGetElement?.(laneId) ?? null;
            audioDbg.logAudio('tile.resume', {
              laneId, ownerKey: resumeKey,
              muted: el2?.muted ?? null, volume: el2?.volume ?? null,
              paused: el2?.paused ?? null,
              currentTime: el2 ? +el2.currentTime.toFixed(3) : null,
              lastPos: resumeKey ? +VideoEngine.getLastPos(resumeKey).toFixed(3) : null,
            });
          } catch {}
          audioDbg.endOpen();
        }, 2000);
      } catch {}
    }
    if (borrow) {
      // handback = returnBorrow tail done (approximated on next frame); tileLive
      // = lane playing on tile (armed on the borrowed lane's next 'playing').
      // The borrowed lane is often already playing at handback, so a fresh
      // 'playing' event may never fire — without a fallback the span would
      // orphan to the 15s watchdog. Close on rAF; keep the 'playing' arm as
      // a diagnostic waypoint (vperfEnd removes the span, later arms no-op).
      requestAnimationFrame(() => {
        import('@/perf/vperf').then((m) => {
          m.vperfMark(closeSpanId, 'handback');
          requestAnimationFrame(() => {
            m.vperfMark(closeSpanId, 'tileLive');
            m.vperfEnd(closeSpanId, { closedBy: 'handbackBind' });
          });
        }).catch(() => {});
      });
      vperfArmLane(borrow.laneId, { spanId: closeSpanId, endOn: 'playing', phase: 'tileLive' });
      vperfArmLane(borrow.laneId, { spanId: closeSpanId, endOn: 'playing' });
    } else {
      requestAnimationFrame(() => {
        import('@/perf/vperf').then((m) => {
          m.vperfMark(closeSpanId, 'tileLive');
          m.vperfEnd(closeSpanId, { closedBy: 'no-borrow raf' });
        }).catch(() => {});
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
      closeAnim: 'idle',
      closeAnimDone: false,
      activePagerIdx: 0,
      pausedOwnerKeys: new Set<string>(),
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
  beginCloseAnim: (kind) => {
    if (get().closeAnim !== 'idle') return;
    set({ closeAnim: kind, closeAnimDone: false });
  },
  signalCloseAnimDone: () => {
    if (get().closeAnim === 'idle') return;
    if (get().closeAnimDone) return;
    set({ closeAnimDone: true });
  },
  appendPosts: (newPosts) => {
    set((s) => {
      const existing = new Set(s.posts.map((p) => p.id));
      // Same media filter as open(): page two must not introduce blank slides.
      const additions = newPosts.filter((p) => !existing.has(p.id) && hasMedia(p));
      if (additions.length === 0) return s;
      return { posts: [...s.posts, ...additions] };
    });
  },


  setActiveIndex: (idx) => {
    const prev = get().activeIndex;
    if (prev === idx) return;
    // Reset the pager index — the incoming post's pager will re-write it on
    // mount. Prevents the scrubber from computing an ownerKey against the
    // outgoing post's page during the swipe.
    set({ activeIndex: idx, activePagerIdx: 0 });
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

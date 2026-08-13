/**
 * CardFeed — Phases 1 & 2 + Phase 3 (virtualization)
 *
 * Vertical scrolling list of `FeedCard`s for the inline Clubhouse Suggested
 * / Friends feeds.
 *
 * Phase 3 (perf): switched from a naive `posts.map(...)` to `react-virtuoso`
 * so DOM footprint stays bounded as users scroll. iOS WebViews cap the
 * number of `<video>` elements and compositor layers; the previous
 * unbounded render was exhausting both, causing black/white screens on
 * tab switches back to Clubhouse. See `feed-virtualization-authority`.
 *
 * Phase 2 additions preserved:
 *  - Single shared IntersectionObserver tracks the most-in-view card and
 *    passes `isActive` down so only one inline video plays at a time.
 *  - `mountVideo` is true only for the active card + its immediate
 *    neighbours; other cards render the poster image to stay under the
 *    WebView's `<video>` budget.
 *  - Persisted multi-media carousel position via `clubhouseStore`.
 */
import React, { forwardRef, useCallback, useEffect, useImperativeHandle, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Virtuoso, type VirtuosoHandle, type StateSnapshot } from 'react-virtuoso';
import type { FeedPost } from '@/components/media-system/types/media';
import type { ActiveActor } from '@/types/actor';
import { useFullscreenFeedStore, useIsViewerOwnedBy } from '@/store/fullscreenFeedStore';
import { openWithOrigin } from '@/lib/openWithOrigin';
import { isPerfEnabled } from '@/perf/navTiming';
import { useClubhouseStore } from '@/store/clubhouseStore';
import { registerNavScroller } from '@/hooks/useScrollDirection';

import { VideoEngine } from '@/video/VideoEngine';
import { feedLaneRoles } from '@/video/feedLaneRoles';
import { vperfFeedActivateStart, vperfFeedActivateEnd, vperfConsumeEarlyStarted } from '@/perf/vperf';
import { isPerfEnabled as _isPerfEnabledForRotate } from '@/perf/navTiming';

import { FeedCard } from './FeedCard';
import type { PostRound } from '@/hooks/feed/usePostRounds';
import type { PostCourseContext } from '@/hooks/feed/usePostCourseContext';
import { CardSkeleton } from '@/components/clubhouse/ClubhouseSkeletonShimmer';
import { safeInitialState } from './feedSnapshot';
import { setIslandEdgeScrolled } from '@/features/chrome-v2/islandEdge';

const CANVAS = '#05070A';
/** Post slab colour (FeedCard CARD). The resting header zone paints this so
 *  the safe area, the island's surroundings and the first post are ONE
 *  continuous surface — no step, no seam. */
const SLAB = '#10151C';

/** How many neighbours on each side of the active card may mount a <video>. */
const VIDEO_NEIGHBOUR_RADIUS = 1; // matches iOS ~3-decoder cap (active ±1 = 3)

/**
 * Reads fullscreen/borrow state from the store INSIDE the item wrapper so
 * `itemContent` no longer depends on `fsOpen` / `borrowedOwnerKey` — that
 * previously changed itemContent's identity on viewer-open and made
 * react-virtuoso remount the borrowed card's FeedCard (visible in traces as
 * a 1ms `inline.unmount` → `inline.mount` blip on the borrowed post).
 *
 * With this gate, viewer-open triggers only a local re-render of each
 * mounted item — the borrowed card's InlineVideo survives (no unmount).
 *
 * The borrow ownerKey match accepts either the bare postId (engine writes
 * the raw postId when InlineVideo loads) or a `${postId}:` prefix (rail
 * lanes / carousel media use `${postId}:${mediaIndex}`).
 */
const FeedItemGate: React.FC<{
  post: FeedPost;
  index: number;
  playingIdx: number;
  activeIdx: number;
  earlyIdx: number;
  children: (v: { isActive: boolean; mountVideo: boolean; earlyMotion: boolean }) => React.ReactNode;
}> = ({ post, index, playingIdx, activeIdx, earlyIdx, children }) => {
  const fsOpen = useFullscreenFeedStore((s) => s.isOpen);
  const borrowedOwnerKey = useFullscreenFeedStore((s) => s.borrow?.ownerKey ?? null);
  const isBorrowedCard =
    fsOpen && !!borrowedOwnerKey &&
    (borrowedOwnerKey === post.id || borrowedOwnerKey.startsWith(`${post.id}:`));
  const isActive = !fsOpen && index === playingIdx;
  const isNear =
    isBorrowedCard || (!fsOpen && Math.abs(index - activeIdx) <= VIDEO_NEIGHBOUR_RADIUS);
  const earlyMotion = !fsOpen && index === earlyIdx && index !== playingIdx;
  return <>{children({ isActive, mountVideo: isNear, earlyMotion })}</>;
};

export interface CardFeedProps {
  posts: FeedPost[];
  onLike: (post: FeedPost, actor?: ActiveActor | null) => void;
  onComment: (post: FeedPost, actor?: ActiveActor | null) => void;
  onShare: (post: FeedPost) => void;
  onProfile: (post: FeedPost) => void;
  onReviewTap?: (post: FeedPost) => void;
  onCourse?: (post: FeedPost) => void;
  getLikeState: (post: FeedPost) => { liked: boolean; count: number } | null | undefined;
  getCommentCount: (post: FeedPost) => number;
  onNearEnd?: () => void;
  hasNextPage?: boolean;
  /** Direct fetch trigger for the fullscreen viewer's pagination. Distinct
   *  from `onNearEnd`, which is the inline list's scroll-position signal. */
  fetchNextPage?: () => void;
  isFetchingNextPage?: boolean;
  topPadding?: number | string;
  bottomPadding?: number;
  onFollow?: (post: FeedPost) => void;
  currentUserId?: string;
  onRefresh?: () => void | Promise<void>;
  isRefreshing?: boolean;
  /** Fires once when the first card's primary content is paint-ready. */
  onFirstContentReady?: () => void;
  /** Per-tab key — routes activeIndex/carouselPosition writes to the right slot. */
  tab?: string;
  /** Restore Virtuoso scroll state from a prior snapshot (per-tab handoff). */
  initialState?: StateSnapshot;
  /** Called on unmount with the current Virtuoso state snapshot. */
  onSnapshot?: (state: StateSnapshot) => void;
  /** Batched course data keyed by course_id (one RPC per page, see Clubhouse.tsx). */
  courseContextMap?: Map<string, PostCourseContext>;
  /** Resolves the course id for a post (course_id, else first tagged course). */
  resolveCourseId?: (post: FeedPost) => string | null;
  /** Batched attached-round data keyed by whs_score_id (C3, one query per page). */
  postRoundMap?: Map<string, PostRound>;
  /** post_id -> whs_score_id for the current page (C3). */
  postScoreIdMap?: Map<string, string>;
  /** False while the batched round chain is still in flight (shell state). */
  postRoundsSettled?: boolean;
  /** Opens the attached round's scorecard. */
  onRoundTap?: (post: FeedPost, round: PostRound) => void;
}

export interface CardFeedHandle {
  /** Synchronously snapshot Virtuoso state via the parent's `onSnapshot`. */
  captureSnapshot: () => void;
}

const PTR_THRESHOLD = 64;
const PTR_MAX_PULL = 96;

export const CardFeed = forwardRef<CardFeedHandle, CardFeedProps>(function CardFeed({
  posts = [],
  onLike,
  onComment,
  onShare,
  onProfile,
  onReviewTap,
  onCourse,
  getLikeState,
  getCommentCount,
  onNearEnd,
  hasNextPage,
  fetchNextPage,
  topPadding = 96,
  bottomPadding = 96,
  isFetchingNextPage = false,
  onFollow,
  currentUserId,
  onRefresh,
  isRefreshing = false,
  onFirstContentReady,
  tab,
  initialState,
  onSnapshot,
  courseContextMap,
  resolveCourseId,
  postRoundMap,
  postScoreIdMap,
  postRoundsSettled = true,
  onRoundTap,
}, ref) {

  const virtuosoRef = useRef<VirtuosoHandle | null>(null);
  const scrollerElRef = useRef<HTMLElement | null>(null);

  // Snapshot Virtuoso state per-tab. Keep `onSnapshot` in a ref so the
  // imperative capture never depends on identity churn.
  const onSnapshotRef = useRef(onSnapshot);
  useEffect(() => { onSnapshotRef.current = onSnapshot; }, [onSnapshot]);

  // getState(cb) is synchronous while the instance is still mounted —
  // the callback fires inline. Expose this so the parent can capture
  // BEFORE flipping activeTab (the keyed remount tears us down otherwise).
  const captureSnapshot = useCallback(() => {
    try {
      virtuosoRef.current?.getState?.((snap: any) => {
        onSnapshotRef.current?.(snap);
      });
    } catch { /* noop */ }
  }, []);

  useImperativeHandle(ref, () => ({ captureSnapshot }), [captureSnapshot]);

  // Secondary fallback: useLayoutEffect cleanup runs BEFORE the ref is
  // nulled (unlike a passive useEffect cleanup), so the snapshot still
  // lands if the parent forgets to call captureSnapshot pre-flip.
  useLayoutEffect(() => {
    return () => { captureSnapshot(); };
  }, [captureSnapshot]);

  // ── Restore scrollTop explicitly ──────────────────────────────────
  // `restoreStateFrom` rehydrates the materialized item RANGES so the
  // target cards mount, but react-virtuoso does NOT reliably restore raw
  // scrollTop on a fresh mount when item heights are dynamic (cards with
  // images/video that measure after mount). Items re-measure, offsets
  // recompute, scroll resets to 0. So drive scrollTop ourselves, with a
  // short rAF retry loop to absorb the post-measure shift.
  // Guard `> 0` skips PTR rubber-band negative "top" snapshots.
  // Validate snapshot against the current posts array before restoring —
  // a snapshot captured at length N must not be applied to a list with
  // fewer items than its recorded ranges reference (crashes Virtuoso with
  // "Cannot read properties of undefined (reading 'index')").
  const validatedInitialState = safeInitialState(initialState, posts.length);
  const restoreScrollTopRef = useRef<number | null>(
    validatedInitialState && typeof (validatedInitialState as any).scrollTop === 'number' && (validatedInitialState as any).scrollTop > 0
      ? (validatedInitialState as any).scrollTop
      : null
  );

  useLayoutEffect(() => {
    const target = restoreScrollTopRef.current;
    if (target == null) return;
    let tries = 0;
    let raf = 0;
    const apply = () => {
      const vr = virtuosoRef.current;
      const scroller = scrollerElRef.current;
      if (!vr || !scroller) { raf = requestAnimationFrame(apply); return; }
      vr.scrollTo({ top: target });
      tries++;
      if (tries < 6 && Math.abs(scroller.scrollTop - target) > 4) {
        raf = requestAnimationFrame(apply);
      } else {
        restoreScrollTopRef.current = null; // release so we never fight the user
      }
    };
    raf = requestAnimationFrame(apply);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  // Explore tab retap → scroll Clubhouse feed to top
  useEffect(() => {
    const onRetap = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail?.tabId !== 'clubhouse') return;
      virtuosoRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    };
    window.addEventListener('clbhouz-active-tab-retap', onRetap);
    return () => window.removeEventListener('clbhouz-active-tab-retap', onRetap);
  }, []);

  // ── Active-card tracking (center-proximity) ──
  // The card whose vertical center is nearest the viewport's vertical center
  // becomes active. Height-independent + symmetric. IntersectionObserver
  // maintains the on-screen candidate set; a scroll listener re-evaluates
  // continuously as the user scrolls within that set.
  const [activeIdx, setActiveIdx] = useState(0);
  // playingIdx lags activeIdx until scrolling settles — only the settled
  // centre tile is promoted to "playing". Prevents load-thrash mid-scroll
  // (iOS cold HLS attach ~1.3s vs. active-window ~400-800ms during scroll).
  const [playingIdx, setPlayingIdx] = useState(0);
  // earlyIdx — the NEXT card in the current scroll direction whose media is
  // already warm on the feed-next lane and whose visible fraction has
  // crossed EARLY_MOTION_FRACTION. When set, InlineVideo mounts+plays the
  // feed-next lane into that card's host so it enters ALREADY MOVING (IG
  // handover feel). Strictly playingIdx ± 1. Cleared on: direction reversal,
  // visibility below EARLY_MOTION_CLEAR, promotion to playingIdx, and
  // fullscreen open. Creation-overlay open pauses all lanes via pauseAll —
  // the flag can stay set (the effect won't re-fire without a state change).
  const [earlyIdx, setEarlyIdx] = useState<number>(-1);
  const settleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const SETTLE_MS = 80;
  // IG-style early activation: cheap now that feed-next preload + PREDICT cache
  // warming + bandwidth seeding are in place. Playing by ~1/3 up feels native.
  const PLAY_IN = 0.30;
  const PLAY_OUT = 0.20;
  const HYSTERESIS = 0.1;
  // Early-motion handover (only touches feed-next; feed-active untouched).
  const EARLY_MOTION_FRACTION = 0.12; // start earlyIdx once neighbour clears 12%
  const EARLY_MOTION_CLEAR = 0.08;    // drop earlyIdx below 8% (hysteresis)
  const EARLY_VELOCITY_MAX = 3;       // px/ms — above this = flick, no early
  const visibilityRef = useRef<Map<number, number>>(new Map());
  const scrollDirRef = useRef<number>(0); // +1 down, -1 up, 0 idle
  const lastScrollTopRef = useRef<number>(0);
  const lastScrollTsRef = useRef<number>(0);
  const scrollVelocityRef = useRef<number>(0); // px/ms
  const observerRef = useRef<IntersectionObserver | null>(null);
  const cardEls = useRef<Map<number, HTMLElement>>(new Map());
  // Refs mirroring state/props so recheckActive (stable useCallback) can
  // read the latest values without re-binding — matches the existing
  // visibility/scroll ref pattern above.
  const playingIdxRef = useRef(0);
  const postsRef = useRef(posts);
  useEffect(() => { playingIdxRef.current = playingIdx; }, [playingIdx]);
  useEffect(() => { postsRef.current = posts; }, [posts]);

  // Debounce: promote activeIdx → playingIdx only after the centre has
  // held steady for SETTLE_MS. PR-B: at the promotion moment we ROTATE
  // ROLES first, then flip playingIdx. Rotation is pure bookkeeping — no
  // engine load/seek fires. The early card's binding (role='next'/'prev')
  // resolves to the SAME physical lane as the incoming 'active' role
  // after rotate(), so useVideoLane's deps are unchanged and no reload
  // occurs — the same <video> element keeps playing seamlessly.
  const lastPromotedRef = useRef<number>(0);
  useEffect(() => {
    if (settleTimer.current) clearTimeout(settleTimer.current);
    settleTimer.current = setTimeout(() => {
      const prev = lastPromotedRef.current;
      const next = activeIdx;
      if (next !== prev && next >= 0 && prev >= 0) {
        const dir: 'down' | 'up' = next > prev ? 'down' : 'up';
        const recycled = feedLaneRoles.rotate(dir);
        if (_isPerfEnabledForRotate()) {
          const snap = feedLaneRoles.snapshot();
          // eslint-disable-next-line no-console
          console.info('[DECIDE]', 'rotation.promote', {
            direction: dir,
            fromIdx: prev,
            toIdx: next,
            recycledLane: recycled,
            borrowedFrozen: snap.frozen,
            map: { active: snap.active, next: snap.next, prev: snap.prev },
          });
        }
      }
      lastPromotedRef.current = next;
      setPlayingIdx(next);
    }, SETTLE_MS);
    return () => {
      if (settleTimer.current) clearTimeout(settleTimer.current);
    };
  }, [activeIdx, posts]);

  // Warm the neighbour cards' HLS symmetrically via role lookup: the RECYCLED
  // lane in each direction is whichever physical lane currently holds the
  // 'next' / 'prev' role. Warming is idempotent (alreadyLoaded skip in the
  // engine); a two-lane degraded window (one lane frozen by a borrow) simply
  // warms into the ex-active — safe by construction.
  useEffect(() => {
    const activePost = posts[playingIdx];
    const expectedActiveOwnerKey = activePost ? `${activePost.id}:0` : undefined;
    const warm = (role: 'next' | 'prev', post: FeedPost | undefined) => {
      const m = post?.mediaItems?.[0];
      if (!post || !m || m.type !== 'video' || !(m as any).hlsUrl) return;
      try {
        const laneId = feedLaneRoles.laneForRole(role);
        // Canonical owner key: primary media of a feed post is `${postId}:0`
        // — matches what InlineVideo's `resolvedOwnerKey` stamps on load/play.
        // Passing bare `post.id` here causes VideoEngine.alreadyLoaded to
        // MISS on promotion (`abc` vs `abc:0`), forcing a reload → poster
        // flash → stale-resume. Normalise at the write site.
        const ownerKey = `${post.id}:0`;
        VideoEngine.preload(laneId, {
          hlsUrl: (m as any).hlsUrl,
          posterUrl: (m as any).thumbnailUrl ?? null,
          postId: ownerKey,
          expectedActiveOwnerKey,
        });
      } catch { /* engine may not be booted yet — safe to ignore */ }
    };
    warm('next', posts[playingIdx + 1]);
    warm('prev', posts[playingIdx - 1]);
  }, [playingIdx, posts]);



  const recheckActive = useCallback(() => {
    // Platform-standard card-feed activation: eligible at >=PLAY_IN visible,
    // most-visible eligible card wins, asymmetric PLAY_OUT + hysteresis to
    // prevent boundary flicker. When multiple cards clear PLAY_IN, tie-break
    // in favour of the card ENTERING in the current scroll direction (reuses
    // the same signed direction signal that feeds the PrefetchController).
    let bestIdx = -1;
    let bestRatio = 0;
    const eligible: number[] = [];
    visibilityRef.current.forEach((ratio, idx) => {
      if (ratio > bestRatio) { bestRatio = ratio; bestIdx = idx; }
      if (ratio >= PLAY_IN) eligible.push(idx);
    });

    // Directional tie-break amongst eligible cards.
    let dirWinner = -1;
    if (eligible.length > 1 && scrollDirRef.current !== 0) {
      dirWinner = scrollDirRef.current > 0
        ? Math.max(...eligible) // scrolling down → prefer entering-from-bottom
        : Math.min(...eligible); // scrolling up   → prefer entering-from-top
    }

    setActiveIdx((prev) => {
      const prevRatio = prev >= 0 ? (visibilityRef.current.get(prev) ?? 0) : 0;
      // Keep current active while it's still >=PLAY_OUT and no one clearly beats it.
      if (prev >= 0 && prevRatio >= PLAY_OUT && (bestRatio - prevRatio) < HYSTERESIS) return prev;
      // Switch to a card that has cleared the play-in threshold — directional winner first.
      if (dirWinner >= 0) return dirWinner;
      if (bestIdx >= 0 && bestRatio >= PLAY_IN) return bestIdx;
      // If nothing qualifies (between cards), keep last active if still barely visible.
      if (prev >= 0 && prevRatio >= PLAY_OUT) return prev;
      return bestIdx >= 0 && bestRatio >= PLAY_OUT ? bestIdx : prev;
    });

    // ── Early-motion candidate (Part 1) ─────────────────────────────
    // playingIdx ± 1 in the current scroll direction, gated on:
    //   1. velocity ceiling (skip during flicks)
    //   2. candidate visibility >= EARLY_MOTION_FRACTION (with hysteresis
    //      down to EARLY_MOTION_CLEAR when the current earlyIdx retreats)
    //   3. candidate warm on feed-next (snapshot.postId === candidate.id)
    // Cold cards are never force-started here — they fall back to the
    // normal PLAY_IN promotion path. Direction reversal, promotion, and
    // visibility retreat all clear via the same setter.
    setEarlyIdx((prevEarly) => {
      // Reading playingIdx via a state read is fine — recheckActive runs on
      // rAF/IO, playingIdx settles independently on its own timer.
      const dir = scrollDirRef.current;
      const vel = scrollVelocityRef.current;
      const currentPlay = playingIdxRef.current;
      if (dir === 0 || vel > EARLY_VELOCITY_MAX || currentPlay < 0) return -1;
      const cand = currentPlay + dir;
      if (cand < 0 || cand >= postsRef.current.length) return -1;
      const ratio = visibilityRef.current.get(cand) ?? 0;

      // Hysteresis: keep current earlyIdx while it's still barely visible.
      if (prevEarly === cand && ratio >= EARLY_MOTION_CLEAR) return cand;
      if (prevEarly !== cand && ratio < EARLY_MOTION_FRACTION) return -1;
      if (ratio < EARLY_MOTION_CLEAR) return -1;

      // Warm-only guard — never force a cold HLS attach at 12%. Resolve
      // via role: down-scroll consults role='next'; up-scroll consults
      // role='prev'. Rotation may have re-pointed those roles to any
      // physical feed lane — the role lookup handles that transparently.
      const cardPost = postsRef.current[cand];
      if (!cardPost) return -1;
      try {
        const laneId = feedLaneRoles.laneForRole(dir > 0 ? 'next' : 'prev');
        const snap = VideoEngine.snapshot(laneId);
        const warm = snap.postId != null &&
          (snap.postId === cardPost.id || snap.postId === `${cardPost.id}:0`) &&
          (snap.state === 'ready' || snap.state === 'playing' || snap.state === 'loading');
        if (!warm) return -1;
      } catch { return -1; }

      return cand;
    });
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          const idx = Number((e.target as HTMLElement).dataset.cardIndex);
          if (Number.isNaN(idx)) continue;
          if (e.isIntersecting) {
            visibilityRef.current.set(idx, e.intersectionRatio);
          } else {
            visibilityRef.current.delete(idx);
          }


        }
        recheckActive();
      },
      { threshold: [0, 0.1, 0.2, 0.3, 0.35, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0] },
    );
    observerRef.current = observer;
    return () => {
      observer.disconnect();
      observerRef.current = null;
      visibilityRef.current.clear();
      cardEls.current.clear();
    };
  }, [recheckActive, posts]);

  // Re-evaluate on scroll — IntersectionObserver alone doesn't fire
  // continuously during scroll within the on-screen set.
  useEffect(() => {
    let raf = 0;
    const onScroll = () => {
      // Signed scroll direction — reused as a directional tie-break in recheckActive.
      const st = scrollerElRef.current?.scrollTop ?? window.scrollY;
      const now = performance.now();
      const dy = st - lastScrollTopRef.current;
      const dt = Math.max(1, now - (lastScrollTsRef.current || now));
      // Instant velocity in px/ms. EMA-smoothed so a single jitter tick
      // doesn't flip the flick verdict on/off; enough responsiveness to
      // catch real flicks within one frame.
      const inst = Math.abs(dy) / dt;
      scrollVelocityRef.current = scrollVelocityRef.current * 0.5 + inst * 0.5;
      if (Math.abs(dy) > 0.5) scrollDirRef.current = dy > 0 ? 1 : -1;
      // Island edge signal — reuses THIS listener (see islandEdge.ts).
      setIslandEdgeScrolled(st > 8);
      lastScrollTopRef.current = st;
      lastScrollTsRef.current = now;
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        recheckActive();
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true, capture: true });
    return () => {
      window.removeEventListener('scroll', onScroll, { capture: true } as any);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [recheckActive]);

  // Clear earlyIdx whenever the current earlyIdx is promoted to playingIdx —
  // the useEffect in InlineVideo already cleans up (unmount + accumulate
  // dualActiveMs) when earlyMotion flips false, so the incoming feed-active
  // mount lands into an empty host as required.
  useEffect(() => {
    if (earlyIdx === playingIdx && earlyIdx !== -1) setEarlyIdx(-1);
  }, [earlyIdx, playingIdx]);

  // Fullscreen open — clear earlyIdx so the InlineVideo cleanup runs
  // (pause + unmount feed-next) instead of leaving a stale early lane behind
  // the borrowed feed-active. pauseAll from viewer-open pauses playback
  // regardless; this clears the DOM residue.
  const fsIsOpen = useFullscreenFeedStore((s) => s.isOpen);
  useEffect(() => {
    if (fsIsOpen && earlyIdx !== -1) setEarlyIdx(-1);
  }, [fsIsOpen, earlyIdx]);

  // ── Activation scorecard ────────────────────────────────────────────
  // Emit one feed.activate line per promotion so early-motion telemetry
  // (earlyStarted + running dualActiveMs) is visible in every capture.
  // SnapFeed owns the fullscreen equivalent; this covers the inline feed.
  const activateT0Ref = useRef<number>(0);
  useEffect(() => {
    const post = posts[playingIdx];
    if (!post) return;
    const ownerKey = `${post.id}:0`;
    const hasVideo = (post as any)?.mediaItems?.some?.((m: any) => m?.type === 'video');
    const mediaType: 'image' | 'video' = hasVideo ? 'video' : 'image';
    activateT0Ref.current = vperfFeedActivateStart('clubhouse');
    // Resolve on next frame — feed-active event wiring already emits its
    // own [VPERF] lines; here we just need earlyStarted + dualActiveMs.
    const raf = requestAnimationFrame(() => {
      vperfFeedActivateEnd({
        t0: activateT0Ref.current,
        idx: playingIdx,
        mediaType,
        earlyStarted: vperfConsumeEarlyStarted(ownerKey),
      });
    });
    return () => cancelAnimationFrame(raf);
  }, [playingIdx, posts]);

  // v11 audio-focus — inline Clubhouse feed registration. Mirrors SnapFeed's
  // wiring so the reconciler can resolve a speaker when the user unmutes.
  // Without this, `audioFocus.laneId` stays null in the engine, reconcile
  // resolves to `whyNone: 'no-audio-focus'`, and every lane is force-muted
  // even though the active card is playing. Re-asserts on fullscreen close
  // and on active-card change; clears on unmount.
  useEffect(() => {
    if (fsIsOpen) return; // overlay branch owns the speaker while open
    const post = posts[playingIdx];
    if (!post) return;
    const hasVideo = (post as any)?.mediaItems?.some?.((m: any) => m?.type === 'video');
    try {
      if (hasVideo) {
        const activeLane = feedLaneRoles.laneForRole('active');
        VideoEngine.setAudioFocus(activeLane, 'feed');
      } else {
        VideoEngine.setAudioFocus(null, 'feed');
      }
    } catch { /* engine may not be booted yet — safe to ignore */ }
  }, [fsIsOpen, playingIdx, posts]);

  useEffect(() => {
    return () => {
      try { VideoEngine.setAudioFocus(null, 'feed'); } catch { /* noop */ }
    };
  }, []);


  // Virtuoso's rangeChanged kept as a no-op; center-proximity owns activeIdx.
  const handleRangeChanged = useCallback(
    (_r: { startIndex: number; endIndex: number }) => {},
    [],
  );



  const setActiveIndex = useClubhouseStore((s) => s.setActiveIndex);
  const setCarouselPosition = useClubhouseStore((s) => s.setCarouselPosition);
  const carouselPositionsByTab = useClubhouseStore((s) => s.carouselPositionsByTab);
  const globalCarouselPositions = useClubhouseStore((s) => s.carouselPositions);
  const carouselPositions = tab ? (carouselPositionsByTab[tab] ?? globalCarouselPositions) : globalCarouselPositions;
  const openFullscreen = useFullscreenFeedStore((s) => s.open);
  // NOTE: fsOpen / borrow.ownerKey are intentionally NOT read at this level.
  // They are consumed inside `FeedItemGate` so viewer-open doesn't change
  // `itemContent` identity (which would remount the borrowed card).

  // Sync the active card to the global store so other consumers (top-bar
  // carousel chip, fullscreen handoff, etc.) stay in step. Routed to the
  // owning tab's slot so switching back retains the centred card.
  useEffect(() => {
    setActiveIndex(activeIdx, tab);
  }, [activeIdx, setActiveIndex, tab]);

  const handleOpenMedia = useCallback(
    (
      post: FeedPost,
      mediaIndex: number,
      origin?: { el: HTMLElement | null; posterUrl?: string | null },
      mediaId?: string | null,
      ownerKey?: string | null,
    ) => {
      const idx = posts.findIndex((p) => p.id === post.id);
      if (idx < 0) return;
      setActiveIndex(idx, tab);
      if (mediaIndex > 0) setCarouselPosition(idx, mediaIndex, tab);
      if (isPerfEnabled()) {
        // eslint-disable-next-line no-console
        import('@/perf/vperf').then(({ vperfSinceActiveMs }) => {
          console.info('[DECIDE]', 'tap.context', {
            postId: post.id,
            mediaId: mediaId ?? null,
            ownerKey: ownerKey ?? null,
            hasOrigin: !!origin?.el,
            isActiveCard: idx === playingIdx,
            playingIdx,
            tappedIdx: idx,
            surface: 'clubhouse',
            sinceActiveMs: vperfSinceActiveMs('clubhouse'),
          });
        }).catch(() => {});
      }
      if (origin?.el) {
        openWithOrigin({
          openedFrom: 'clubhouse',
          posts,
          index: idx,
          originEl: origin.el,
          posterUrl: origin.posterUrl ?? null,
          mediaId: mediaId ?? null,
          mediaIndex,
          railOwnerKey: ownerKey ?? null,
          options: {
            hasNextPage: hasNextPage ?? false,
            fetchNextPage: hasNextPage ? fetchNextPage : undefined,
            isFetchingNextPage: isFetchingNextPage ?? false,
          },
        });
      } else {
        openFullscreen(posts, idx, {
          mediaId: mediaId ?? null,
          openedFrom: 'clubhouse',
          hasNextPage: hasNextPage ?? false,
          fetchNextPage: hasNextPage ? fetchNextPage : undefined,
          isFetchingNextPage: isFetchingNextPage ?? false,
        });
      }
    },
    [posts, setActiveIndex, setCarouselPosition, openFullscreen, tab, playingIdx, hasNextPage, fetchNextPage, isFetchingNextPage],
  );

  // Stable per-post carousel-change callback so FeedCard memo holds.
  const carouselChangeCacheRef = useRef(new Map<string, (post: FeedPost, slide: number) => void>());
  const getCarouselChangeHandler = useCallback(
    (postId: string) => {
      const cache = carouselChangeCacheRef.current;
      let fn = cache.get(postId);
      if (!fn) {
        fn = (post: FeedPost, slide: number) => {
          // Recompute index at call time — `posts` may have grown.
          const idx = posts.findIndex((p) => p.id === post.id);
          if (idx >= 0) setCarouselPosition(idx, slide, tab);
        };
        cache.set(postId, fn);
      }
      return fn;
    },
    [posts, setCarouselPosition, tab],
  );

  // Garbage-collect carousel-change cache when posts shrink/change.
  useEffect(() => {
    const live = new Set(posts.map((p) => p.id));
    const cache = carouselChangeCacheRef.current;
    cache.forEach((_, id) => { if (!live.has(id)) cache.delete(id); });
  }, [posts]);

  const itemContent = useCallback(
    (index: number, post: FeedPost) => {
      const likeState = getLikeState(post);



      const initialSlide = carouselPositions.get(index) ?? 0;
      return (
        <div
          data-card-index={index}
          ref={(el) => {
            const obs = observerRef.current;
            if (el) {
              cardEls.current.set(index, el);
              if (obs) obs.observe(el);
            } else {
              cardEls.current.delete(index);
            }
          }}
        >
          <FeedItemGate
            post={post}
            index={index}
            playingIdx={playingIdx}
            activeIdx={activeIdx}
            earlyIdx={earlyIdx}
          >
            {({ isActive, mountVideo, earlyMotion }) => (
              <FeedCard
                post={post}
                liked={!!likeState?.liked}
                likeCount={likeState?.count ?? post.likeCount ?? 0}
                commentCount={getCommentCount(post)}
                onLike={onLike}
                onComment={onComment}
                onShare={onShare}
                onProfile={onProfile}
                onReviewTap={onReviewTap}
                onCourse={onCourse}
                onOpenMedia={handleOpenMedia}
                isActive={isActive}
                mountVideo={mountVideo}
                earlyMotion={earlyMotion}
                initialMediaIndex={initialSlide}
                onCarouselIndexChange={getCarouselChangeHandler(post.id)}
                onFollow={onFollow}
                currentUserId={currentUserId}
                feedIndex={index}
                isFirstCard={index === 0}
                onContentReady={onFirstContentReady}
                courseContext={(() => {
                  const cid = resolveCourseId?.(post) ?? post.courseId ?? null;
                  return cid ? courseContextMap?.get(cid) ?? null : null;
                })()}
                postRound={(() => {
                  const sid = postScoreIdMap?.get(post.id) ?? null;
                  return sid ? postRoundMap?.get(sid) ?? null : null;
                })()}
                postRoundPending={(() => {
                  if (postRoundsSettled) return false;
                  const sid = postScoreIdMap?.get(post.id) ?? null;
                  return !!sid && !postRoundMap?.get(sid);
                })()}
                postRoundMissing={(() => {
                  if (!postRoundsSettled) return false;
                  const sid = postScoreIdMap?.get(post.id) ?? null;
                  return !!sid && !postRoundMap?.get(sid);
                })()}
                onRoundTap={onRoundTap}
              />
            )}
          </FeedItemGate>
          {/* Inter-slab gap — the dark canvas showing through, never a painted strip */}
          <div aria-hidden style={{ height: 8, background: 'transparent' }} />
        </div>
      );
    },
    [
      activeIdx,
      playingIdx,
      earlyIdx,
      carouselPositions,
      getCarouselChangeHandler,
      getCommentCount,
      getLikeState,
      handleOpenMedia,
      onComment,
      onCourse,
      onLike,
      onProfile,
      onReviewTap,
      onShare,
      onFollow,
      currentUserId,
      onFirstContentReady,
      courseContextMap,
      resolveCourseId,
      postRoundMap,
      postScoreIdMap,
      postRoundsSettled,
      onRoundTap,
    ],
  );

  const components = useMemo(
    () => ({
      Header: () => (
        <div style={{ height: 0, paddingTop: topPadding, background: SLAB }} />
      ),
      Footer: () => (
        <>
          {isFetchingNextPage && (
            <div style={{ padding: '8px 0 12px' }}>
              <div style={{ position: 'relative', width: '100%', aspectRatio: '16 / 9', overflow: 'hidden' }}>
                <CardSkeleton isStatic={false} variant="regular" mediaRatio="16/9" />
              </div>
            </div>
          )}
          <div style={{ height: bottomPadding }} />
        </>
      ),
    }),
    [topPadding, bottomPadding, isFetchingNextPage],
  );


  // Mirror pagination state + newly-loaded posts into the fullscreen store
  // while the viewer is owned by this surface, so swipes past the snapshot
  // taken at open() keep loading. Gated on ownership - the store is global.
  const isViewerOwnedHere = useIsViewerOwnedBy('clubhouse');
  const setPaginationState = useFullscreenFeedStore((s) => s.setPaginationState);
  useEffect(() => {
    if (!isViewerOwnedHere) return;
    setPaginationState({
      hasNextPage: hasNextPage ?? false,
      isFetchingNextPage: isFetchingNextPage ?? false,
    });
  }, [isViewerOwnedHere, hasNextPage, isFetchingNextPage, setPaginationState]);

  useEffect(() => {
    if (!isViewerOwnedHere) return;
    // Store dedupes by post id.
    useFullscreenFeedStore.getState().appendPosts(posts);
  }, [isViewerOwnedHere, posts]);

  const handleEndReached = useCallback(() => {
    if (hasNextPage && onNearEnd) onNearEnd();
  }, [hasNextPage, onNearEnd]);






  // ── Pull-to-refresh ───────────────────────────────────────────────
  // Engages only when the real scroller (#root) is at top. Damped 0.5x,
  // capped at PTR_MAX_PULL. Releasing past PTR_THRESHOLD fires onRefresh.
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [pull, setPull] = useState(0);
  const pullRef = useRef(0);
  const startYRef = useRef<number | null>(null);
  const armedRef = useRef(false);
  const activelyPullingRef = useRef(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || !onRefresh) return;

    const getScrollTop = () => scrollerElRef.current?.scrollTop ?? 0;

    const onTouchStart = (e: TouchEvent) => {
      if (isRefreshing) return;
      if (e.touches.length !== 1) return;
      startYRef.current = e.touches[0].clientY;
      armedRef.current = getScrollTop() <= 0;
      activelyPullingRef.current = false;
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!armedRef.current || startYRef.current == null) return;
      const dy = e.touches[0].clientY - startYRef.current;
      if (dy <= 0) {
        if (activelyPullingRef.current) {
          activelyPullingRef.current = false;
          pullRef.current = 0;
          setPull(0);
        }
        return;
      }
      // Only check scrollTop BEFORE we've engaged; once engaged we own the gesture.
      if (!activelyPullingRef.current && getScrollTop() > 0) {
        armedRef.current = false;
        return;
      }

      activelyPullingRef.current = true;
      const next = Math.min(dy * 0.5, PTR_MAX_PULL);
      pullRef.current = next;
      setPull(next);
      if (e.cancelable) e.preventDefault();
    };

    const onTouchEnd = () => {
      if (activelyPullingRef.current && pullRef.current >= PTR_THRESHOLD && onRefresh) {
        // Snap to resting position and fire
        pullRef.current = PTR_THRESHOLD;
        setPull(PTR_THRESHOLD);
        
        Promise.resolve(onRefresh()).catch(() => {});
      } else {
        pullRef.current = 0;
        setPull(0);
      }
      activelyPullingRef.current = false;
      armedRef.current = false;
      startYRef.current = null;
    };

    el.addEventListener('touchstart', onTouchStart, { passive: true });
    el.addEventListener('touchmove', onTouchMove, { passive: false });
    el.addEventListener('touchend', onTouchEnd, { passive: true });
    el.addEventListener('touchcancel', onTouchEnd, { passive: true });
    return () => {
      el.removeEventListener('touchstart', onTouchStart as any);
      el.removeEventListener('touchmove', onTouchMove as any);
      el.removeEventListener('touchend', onTouchEnd as any);
      el.removeEventListener('touchcancel', onTouchEnd as any);
    };
  }, [onRefresh, isRefreshing]);

  // When a refresh completes, retract the spinner.
  useEffect(() => {
    if (!isRefreshing && !activelyPullingRef.current) {
      pullRef.current = 0;
      setPull(0);
    }
  }, [isRefreshing]);

  const spinnerOffset = isRefreshing ? PTR_THRESHOLD : pull;
  const spinnerProgress = Math.min(pull / PTR_THRESHOLD, 1);
  const spinnerRotation = isRefreshing ? 0 : pull * 3;

  return (
    <div
      ref={containerRef}
      style={{
        background: CANVAS,
        height: '100dvh',
        width: '100%',
        position: 'relative',
        overscrollBehaviorY: 'contain',
      }}
      data-card-feed
    >
      {/* Pull-to-refresh spinner */}
      {onRefresh && (spinnerOffset > 0 || isRefreshing) && (
        <div
          aria-hidden={!isRefreshing}
          style={{
            position: 'absolute',
            top: `calc(env(safe-area-inset-top, 0px) + 59px)`,
            left: '50%',
            transform: `translate(-50%, ${spinnerOffset - 36}px)`,
            zIndex: 30,
            pointerEvents: 'none',
            transition: activelyPullingRef.current ? 'none' : 'transform 220ms cubic-bezier(0.22, 1, 0.36, 1)',
            opacity: isRefreshing ? 1 : Math.min(0.4 + spinnerProgress * 0.6, 1),
          }}
        >
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 999,
              background: 'rgba(21,23,31,0.6)',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(0,0,0,0.25)',
            }}
          >
            <div
              style={{
                width: 22,
                height: 22,
                borderRadius: '50%',
                border: '2px solid rgba(255,255,255,0.18)',
                borderTopColor: 'rgba(255,255,255,0.92)',
                transform: `rotate(${spinnerRotation}deg)`,
                animation: isRefreshing ? 'ptrSpin 0.8s linear infinite' : undefined,
              }}
            />
          </div>
          <style>{`@keyframes ptrSpin { to { transform: rotate(360deg); } }`}</style>
        </div>
      )}
      <div
        style={{
          height: '100%',
          transform: `translateY(${isRefreshing ? PTR_THRESHOLD : pull}px)`,
          transition: activelyPullingRef.current ? 'none' : 'transform 220ms cubic-bezier(0.22, 1, 0.36, 1)',
          willChange: 'transform',
        }}
      >
        <Virtuoso
          ref={virtuosoRef}
          scrollerRef={(el) => {
            const node = (el as HTMLElement) ?? null;
            scrollerElRef.current = node;
            // Wire this scroller into the floating-nav scroll-direction store
            // so the pill condenses/expands as the feed scrolls. Virtuoso
            // owns its own inner scroll div — window never scrolls on this
            // route (PageRoot fixedHeight), so the auto-registered window
            // scroller receives no events.
            if (node) registerNavScroller(node);
          }}
          data={posts}
          itemContent={itemContent}
          computeItemKey={(_, post) => post.id}
          rangeChanged={handleRangeChanged}
          endReached={handleEndReached}
          // Symmetric viewport-anchored keep window. Top was previously 400
          // (half of bottom), which unmounted playingIdx-1 under any real
          // down-flick velocity. On reversal the up-entering card had no
          // host and no observer entry, starving the (verified-symmetric)
          // role rotation + warm + early-motion chain. Widening top to
          // match bottom keeps playingIdx-1 always mounted with its paused
          // first frame and playingIdx-2 as the observer's early-warning
          // entry. See docs/video/2026-07-08-pr-c-symmetric-mount-window-shipnote.md
          increaseViewportBy={{ top: 800, bottom: 800 }}
          overscan={{ main: 400, reverse: 400 }}
          components={components}
          restoreStateFrom={validatedInitialState}
          initialScrollTop={restoreScrollTopRef.current ?? 0}
          initialTopMostItemIndex={validatedInitialState ? undefined : 0}
          style={{ height: '100%', width: '100%' }}
        />
      </div>

    </div>
  );
});

CardFeed.displayName = 'CardFeed';

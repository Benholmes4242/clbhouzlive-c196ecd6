import React, { useRef, useEffect, useCallback, useState, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { useClubhouseStore } from '@/store/clubhouseStore';
import { FeedSlide } from './FeedSlide';
import type { FeedPost } from '@/components/media-system/types/media';
import { haptic } from '@/utils/haptics';
// Stage B3 teardown: HLS preload / pool wiring removed.

import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useFullscreenFeedStore } from '@/store/fullscreenFeedStore';
import { vperfStart, vperfArmLane, vperfNextId, vperfFeedScrollTick, vperfFeedActivateStart, vperfFeedActivateEnd, vperfEnd, vperfSupersede } from '@/perf/vperf';
import { PrefetchController } from '@/video/PrefetchController';
import { VideoPool } from '@/video/pool/VideoPool';

import { trace } from '@/perf/trace';
import { VideoEngine } from '@/video/VideoEngine';
import { feedLaneRoles } from '@/video/feedLaneRoles';
import { isPerfEnabled } from '@/perf/navTiming';
import { audioDebugEnabled, logAudio } from '@/perf/audioDebug';
import { useInviteSheet } from '@/hooks/useInviteSheet';
import clbhouzLogo from '@/assets/clbhouz-logo.png';

// Normalized owner-key compare — bare "X" ≡ "X:0", ":1"/":2" distinct.
// Never use strict === here; strict compare caused false-null mismatch
// reports on the [CAROUSEL2] diagnostic and burned a round.
const _normalizeOwnerKey = (k: string | null | undefined): string | null =>
  !k ? null : k.includes(':') ? k : `${k}:0`;
const ownerKeysMatch = (
  laneKey: string | null | undefined,
  expectedKey: string,
): boolean => _normalizeOwnerKey(laneKey) === _normalizeOwnerKey(expectedKey);




const NEAR_END_THRESHOLD = 3;
const ACTIVE_SLIDE_RATIO = 0.5;
// Multiple thresholds let the observer fire during transitions, not just
// at the 50% boundary crossing. Sub-thresholds catch slow drift and give
// the active-index update path earlier signals.
const INTERSECTION_THRESHOLDS = [0.25, 0.5, 0.75];
const PTR_DISTANCE = 80;
// Widened from 3 to 5 to bridge rapid flick scrolls that previously
// outran the virtualization window. 11-slide buffer.
const VIRTUAL_WINDOW = 5;
// Tightened from 80ms to 20ms so the virtualization window slides nearly
// in real time with the scroll position, preventing brief black placeholders.
const ACTIVE_INDEX_DEBOUNCE_MS = 20;

interface SnapFeedProps {
  posts: FeedPost[];
  activeTab: string;
  onNearEnd: () => void;
  onRefresh: () => Promise<void>;
  isRefreshing: boolean;
  hasNextPage: boolean;
  followOverrides: Map<string, boolean>;
  onFollowChange: (userId: string, isFollowed: boolean) => void;
  onFirstFrameReady?: () => void;
  onLike?: (post: FeedPost) => void;
  onComment?: () => void;
  onShare?: (post: FeedPost) => void;
  getLikeState?: (post: FeedPost) => { isLiked: boolean; count: number };
  getCommentCount?: (post: FeedPost) => number;
  startIndex?: number;
  onActiveIndexChange?: (idx: number) => void;
  activeIndexOverride?: number;
  /** Forwarded to FeedSlide so the fullscreen viewer (gallery mode included) can suppress the inline top-right dots in favour of the segmented FullscreenCarouselOverlay. */
  isFullscreen?: boolean;
  /** Tags pool entries created by this SnapFeed so fullscreen can prune its own without touching feed entries. */
  surface?: 'feed' | 'fullscreen';
  /** When true, disables DB hooks (watch-progress, UCP, comments) that require a real post id. Used by gallery/flat viewers with synthetic ids. */
  readOnly?: boolean;
}

export function SnapFeed({
  posts, activeTab, onNearEnd, onRefresh, isRefreshing, hasNextPage,
  followOverrides, onFollowChange, onFirstFrameReady,
  onLike, onComment, onShare, getLikeState, getCommentCount,
  startIndex,
  onActiveIndexChange,
  activeIndexOverride,
  isFullscreen,
  surface = 'feed',
  readOnly = false,
}: SnapFeedProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { openInviteSheet } = useInviteSheet();
  const slideRefs = useRef<Map<number, HTMLDivElement>>(new Map());
  const observerRef = useRef<IntersectionObserver | null>(null);
  const firstFrameFired = useRef(false);
  const ptrStartY = useRef(0);
  const ptrActive = useRef(false);
  const hasScrolledToStart = useRef(false);
  const [anySlideZoomed, setAnySlideZoomed] = useState(false);

  // ── Stable refs for observer callback (avoid reconnecting observer) ──
  const postsRef = useRef(posts);
  const postsLengthRef = useRef(posts.length);
  const hasNextPageRef = useRef(hasNextPage);
  const onNearEndRef = useRef(onNearEnd);
  const onActiveIndexChangeRef = useRef(onActiveIndexChange);
  const pendingIndexRef = useRef<number | null>(null);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => { postsRef.current = posts; }, [posts]);
  useEffect(() => { postsLengthRef.current = posts.length; }, [posts.length]);
  useEffect(() => { hasNextPageRef.current = hasNextPage; }, [hasNextPage]);
  useEffect(() => { onNearEndRef.current = onNearEnd; }, [onNearEnd]);
  useEffect(() => { onActiveIndexChangeRef.current = onActiveIndexChange; }, [onActiveIndexChange]);

  // Scroll to startIndex on first mount only — retry until container has layout
  useEffect(() => {
    if (hasScrolledToStart.current) return;
    if (!startIndex || startIndex === 0) return;
    const container = containerRef.current;
    if (!container) return;

    let attempts = 0;
    const MAX_ATTEMPTS = 10;

    const tryScroll = () => {
      const slideHeight = container.clientHeight;
      if (slideHeight === 0 && attempts < MAX_ATTEMPTS) {
        attempts++;
        requestAnimationFrame(tryScroll);
        return;
      }
      const resolvedHeight = slideHeight > 0 ? slideHeight : window.innerHeight;
      container.scrollTo({
        top: resolvedHeight * startIndex,
        behavior: 'instant' as ScrollBehavior,
      });
      hasScrolledToStart.current = true;
    };

    requestAnimationFrame(tryScroll);
  }, [startIndex]);

  // ── Explore tab retap / cross-page Explore tap: scroll feed to top ──
  useEffect(() => {
    const onRetap = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail?.tabId !== 'clubhouse') return;
      // Cancel any pending startIndex resume — user explicitly wants the top.
      hasScrolledToStart.current = true;
      containerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    };
    window.addEventListener('clbhouz-active-tab-retap', onRetap);
    return () => window.removeEventListener('clbhouz-active-tab-retap', onRetap);
  }, []);

  // Forensic X-ray — clear log on surface teardown so the buffer records the
  // active slot's disappearance (settle logs live in the activeIndex effect).
  useEffect(() => {
    return () => {
      if (audioDebugEnabled()) {
        try {
          logAudio('surface.active', {
            surface: surface === 'fullscreen' ? 'fullscreen' : 'clubhouse',
            activeIndex: null,
            laneId: null,
            postId: null,
            cleared: true,
          });
        } catch { /* noop */ }
      }
      // v10 audio-focus — release the inline feed's focus on unmount so the
      // reconciler stops resolving to a lane that no visible surface owns.
      if (surface !== 'fullscreen') {
        try { VideoEngine.setAudioFocus(null, 'feed'); } catch { /* noop */ }
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  // v11 audio-focus — dedicated registration that closes the two gaps found
  // in the v10 audit:
  //   (a) Initial mount of the active slide: the transition-settle effect
  //       below early-returns when prevActiveRef already equals activeIndex
  //       (true on mount), so focus never registered for the landing slide.
  //   (b) Fullscreen round-trip: when the overlay closes while the inline
  //       feed still owns the active slide, we re-assert focus so the
  //       reconciler picks the inline feed lane back up.
  // Mechanism for (b): subscribe to `useFullscreenFeedStore(s => s.isOpen)`
  // and re-register in the same effect body whenever it flips (or on any
  // activeIndex change). Inline surface only — the fullscreen surface's
  // speaker is owned by the reconciler's overlay branch.
  const fsOpen = useFullscreenFeedStore(s => s.isOpen);


  const storeActiveIndex = useClubhouseStore(s => s.activeIndex);
  const setActiveIndex = useClubhouseStore(s => s.setActiveIndex);
  // Opening-slide media selectors threaded from the tap opener. `mediaId` is
  // authoritative (stable id resolved against grouped mediaItems in FeedSlide);
  // `mediaIndex` is the positional fallback. Only applied to the slide at
  // `startIndex` — every other slide renders its media[0] as today.
  const openingMediaIndex = useFullscreenFeedStore(s => s.mediaIndex);
  const openingMediaId = useFullscreenFeedStore(s => s.mediaId);
  // When an override is supplied (e.g. by FullscreenFeedOverlay which owns its
  // own active-index store), it is the source of truth for both rendering AND
  // virtualization window math. Previously SnapFeed used storeActiveIndex for
  // window math even when overridden — which left off-window slides as black
  // placeholders when the overlay opened at index ≥ VIRTUAL_WINDOW (4+).
  const activeIndex = activeIndexOverride ?? storeActiveIndex;
  const location = useLocation();

  // v11 focus registration — see comment block above. Runs on mount (covers
  // gap A: the landing slide) and again whenever `fsOpen` transitions
  // (covers gap B: fullscreen→inline round-trip). Inline surface only.
  useEffect(() => {
    if (surface === 'fullscreen') return;
    // When the overlay is open, do not fight the overlay branch for focus —
    // the reconciler resolves the speaker via the borrow / fullscreen-solo
    // paths. When it closes, re-assert inline focus below.
    if (fsOpen) return;
    const post = posts[activeIndex];
    if (!post) return;
    const hasVideo = (post as any)?.mediaItems?.some?.((m: any) => m?.type === 'video');
    try {
      if (hasVideo) {
        const activeLane = feedLaneRoles.laneForRole('active');
        VideoEngine.setAudioFocus(activeLane, 'feed');
        if (audioDebugEnabled()) {
          try { logAudio('focus.reassert', { trigger: 'mount-or-fs-close', activeIndex, postId: post.id, activeLane }); } catch {}
        }
      } else {
        VideoEngine.setAudioFocus(null, 'feed');
      }
    } catch { /* noop */ }
  }, [surface, fsOpen, activeIndex, posts]);


  // [VPERF] S4 swipe.vertical — a vertical settle on a video slide.
  // Closes on the next 'firstFrame' event on the surface's active lane
  // ('feed-active' in the Clubhouse feed; 'fullscreen' in the overlay —
  // the singleton fullscreen lane is where the video actually plays, so
  // arming feed-active there yielded 15001ms watchdog orphans). 'playing'
  // is a phase waypoint only. Image slides skip the lane arm entirely
  // (no lane events => the 900ms fallback below closes feed.activate;
  // swipe.vertical is not started for image slides to avoid orphans).
  const prevActiveRef = useRef<number>(activeIndex);
  const activateT0Ref = useRef<number>(0);
  const activateWarmRef = useRef<boolean>(false);
  const activateDoneRef = useRef<boolean>(true);
  useEffect(() => {
    if (prevActiveRef.current === activeIndex) return;
    const fromIdx = prevActiveRef.current;
    prevActiveRef.current = activeIndex;
    const post = posts[activeIndex];
    if (!post) return;

    // Forensic X-ray — announces the surface's active slot so downstream
    // audio decision records can be correlated by (surface, activeIndex,
    // postId). Fired on every settle; the clear log lives in the unmount
    // effect below.
    if (audioDebugEnabled()) {
      try {
        const laneId = surface === 'fullscreen' ? 'fullscreen' : 'feed-active';
        logAudio('surface.active', {
          surface: surface === 'fullscreen' ? 'fullscreen' : 'clubhouse',
          activeIndex,
          laneId,
          postId: post.id,
        });
      } catch { /* noop */ }
    }


    const hasVideo = (post as any)?.mediaItems?.some?.((m: any) => m?.type === 'video');
    const mediaType: 'image' | 'video' = hasVideo ? 'video' : 'image';
    // Surface-aware lane: fullscreen overlay plays on the singleton
    // 'fullscreen' lane; the inline feed plays on 'feed-active'.
    const armLane: 'fullscreen' | 'feed-active' =
      surface === 'fullscreen' ? 'fullscreen' : 'feed-active';

    // v10 audio-focus registry — inline feed only. The fullscreen branch of
    // the reconciler owns the overlay's speaker selection, so we do NOT
    // register focus from the fullscreen surface. Image slides clear focus
    // (there is no lane to unmute).
    if (surface !== 'fullscreen') {
      try {
        if (mediaType === 'video') {
          const activeLane = feedLaneRoles.laneForRole('active');
          VideoEngine.setAudioFocus(activeLane, 'feed');
        } else {
          VideoEngine.setAudioFocus(null, 'feed');
        }
      } catch { /* noop */ }
    }

    // swipe.vertical — video slides only. Image slides have no lane
    // events on either surface, so starting the span would guarantee
    // a 15001ms watchdog orphan.
    let swipeSpanId: string | null = null;
    if (mediaType === 'video') {
      swipeSpanId = vperfNextId(`swipe.vertical:${post.id}`);
      vperfStart(swipeSpanId, 'swipe.vertical', { postId: post.id, activeIndex, surface });
      vperfArmLane(armLane, { spanId: swipeSpanId, endOn: 'firstFrame' });
      vperfArmLane(armLane, { spanId: swipeSpanId, endOn: 'playing', phase: 'playing' });
    }

    // [BASELINE] feed.activate — activation → media visible latency.
    activateT0Ref.current = vperfFeedActivateStart();
    activateDoneRef.current = false;
    const armId = vperfNextId(`feed.activate:${post.id}`);
    vperfStart(armId, mediaType === 'image' ? 'feed.activate.image' : 'feed.activate.video.cold', { idx: activeIndex, surface });
    if (mediaType === 'video') {
      vperfArmLane(armLane, { spanId: armId, endOn: 'firstFrame' });
      vperfArmLane(armLane, { spanId: armId, endOn: 'playing', phase: 'playing' });
    } else {
      // Image slides have no lane events — close the armId span on the
      // next frame via imageFallback so it never orphans to the 15s
      // watchdog on either surface (inline OR fullscreen overlay).
      requestAnimationFrame(() => {
        vperfEnd(armId, { closedBy: 'imageFallback' });
      });
    }

    // [FSVERT] slide.change — vertical activeIndex transition. Fullscreen
    // overlay surface only (matches the [FSVERT] axis). isPerfEnabled-gated
    // inside trace().
    if (isFullscreen) {
      const wasPrefetched = PrefetchController.wasPrefetched(`${post.id}:0`);
      const dir: 1 | -1 | 0 = activeIndex > fromIdx ? 1 : activeIndex < fromIdx ? -1 : 0;
      trace('slide.change', {
        surface: 'FSVERT',
        from: fromIdx,
        to: activeIndex,
        dir,
        postId: post.id,
        mediaType,
        prefetched: wasPrefetched,
      });

      // [FSVERT] slide.mismatch guard — video slides only. Retained prior
      // content on the fullscreen lane (paused previous video while the
      // incoming slide is an image, or before the repoint lands) must
      // never fire the guard. Record the lane owner at transition start
      // and wait until EITHER (a) firstFrame && the lane repointed away
      // from that start-owner (real new frame) — then compare with the
      // expected key; OR (b) firstFrame && the lane already matches the
      // expected key; OR (c) 1500ms timeout — report nothing.
      if (mediaType === 'video' && isPerfEnabled()) {
        const expectedKey = `${post.id}:0`;
        let laneOwnerKeyAtStart: string | null = null;
        try { laneOwnerKeyAtStart = VideoEngine.snapshot('fullscreen').postId ?? null; } catch { /* noop */ }
        const started = performance.now();
        let raf = 0;
        let done = false;
        const poll = () => {
          if (done) return;
          if (performance.now() - started > 1500) {
            done = true;
            return;
          }
          try {
            const s = VideoEngine.snapshot('fullscreen');
            if (s.firstFrame) {
              const repointed = !ownerKeysMatch(s.postId, laneOwnerKeyAtStart ?? '');
              const matches = ownerKeysMatch(s.postId, expectedKey);
              if (matches) {
                done = true;
                return;
              }
              if (repointed) {
                done = true;
                trace('slide.mismatch', {
                  surface: 'FSVERT',
                  expectedOwnerKey: expectedKey,
                  laneOwnerKey: s.postId,
                  laneOwnerKeyAtStart,
                  activeIndex,
                });
                return;
              }
              // firstFrame but still on the retained prior owner —
              // keep polling for the repoint (or timeout).
            }
          } catch { /* trace-only */ }
          raf = requestAnimationFrame(poll);
        };
        raf = requestAnimationFrame(poll);
        // best-effort: no explicit cancel, done flag + timeout terminate.
      }
    }

    const finalize = () => {
      if (activateDoneRef.current) return;
      activateDoneRef.current = true;
      const wasPrefetched = PrefetchController.wasPrefetched(`${post.id}:0`);
      vperfFeedActivateEnd({
        t0: activateT0Ref.current,
        idx: activeIndex,
        mediaType,
        warm: activateWarmRef.current,
        prefetched: wasPrefetched,
      });
    };
    // Fallback finalize after 900ms if lane events never arrive (orphan guard).
    const to = window.setTimeout(finalize, 900);
    if (mediaType === 'image') requestAnimationFrame(() => { finalize(); });
    return () => {
      clearTimeout(to);
      finalize();
      // Supersede any still-open spans for the OUTGOING slide — user
      // swiped past before firstFrame arrived. vperfSupersede is a
      // no-op if the span already closed via lane events or fallback.
      if (swipeSpanId) vperfSupersede(swipeSpanId, { supersededBy: 'deactivate' });
      vperfSupersede(armId, { supersededBy: 'deactivate' });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeIndex, isFullscreen]);



  // [BASELINE] feed.scroll sampler — subscribes to the outer scroll element.
  // [PREDICT] Part 2 — coalesced velocity/direction sampling drives the
  // PrefetchController: video cards predicted to enter the activation zone
  // within ~1.5s get their HLS manifest + first-rung segment fetched into
  // the browser HTTP cache before the user arrives.
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    let lastTop = el.scrollTop;
    let lastTs = performance.now();
    let lastDir: 1 | -1 | 0 = 0;
    const onScroll = () => {
      vperfFeedScrollTick('snapfeed');
      const now = performance.now();
      const top = el.scrollTop;
      const dt = now - lastTs;
      const dy = top - lastTop;
      lastTs = now;
      lastTop = top;
      if (dt <= 0) return;
      const vel = dy / dt; // px per ms (signed)
      const dir: 1 | -1 | 0 = vel > 0.02 ? 1 : vel < -0.02 ? -1 : 0;
      if (dir === 0) return;
      if (lastDir !== 0 && dir !== lastDir) {
        PrefetchController.abortAll('reversedDir');
      }
      lastDir = dir;
      const slideH = el.clientHeight || window.innerHeight;
      if (slideH <= 0) return;
      const activeIdx = Math.round(top / slideH);
      const allPosts = postsRef.current;
      const speed = Math.abs(vel);
      // Look at the two upcoming slides in scroll direction.
      for (let k = 1; k <= 2; k++) {
        const idx = activeIdx + dir * k;
        if (idx < 0 || idx >= allPosts.length) continue;
        const post = allPosts[idx];
        if (!post) continue;
        const media0 = post.mediaItems?.[0];
        if (!media0 || media0.type !== 'video') continue;
        const hlsUrl = (media0 as any).hlsUrl as string | undefined;
        if (!hlsUrl) continue;
        const slideTop = idx * slideH;
        const distance = Math.abs(slideTop - top);
        const arrivalMs = distance / speed;
        if (arrivalMs > 0 && arrivalMs <= 1500) {
          PrefetchController.request(`${post.id}:0`, hlsUrl);
          // Warm a pooled <video> for the +1 neighbour so the swipe is
          // a same-slot reuse (readyState≥2), not a cold hls rebuild.
          if (k === 1) VideoPool.prewarm(hlsUrl, 'inline');
        }
      }
    };
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, []);



  // NOTE: no route-change pauseAll here — the VideoEngine owns per-lane
  // activation via useVideoLane, and the fullscreen overlay's open path
  // must not pause a borrowed lane on its own open. Route-change cleanup
  // for engine lanes happens inside the engine (borrow guard + owner guard).

  // Watch-progress tracking — populates user_content_preferences with
  // watched_partial / watched_complete signals for whichever surface is
  // hosting this SnapFeed (Clubhouse Suggested inline, fullscreen overlay,
  // course media viewer). Container-scoped so stacked SnapFeeds don't
  // cross-target each other's <video> elements.
  const { session } = useSupabaseSession();
  const trackerUserId = session?.user?.id;
  void trackerUserId;


  // ── IntersectionObserver setup ──
  useEffect(() => {
    observerRef.current?.disconnect();

    observerRef.current = new IntersectionObserver((entries) => {
      let bestEntry: IntersectionObserverEntry | null = null;
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        if (!bestEntry || entry.intersectionRatio > bestEntry.intersectionRatio) {
          bestEntry = entry;
        }
      }

      if (bestEntry && bestEntry.intersectionRatio >= ACTIVE_SLIDE_RATIO) {
        const idx = Number((bestEntry.target as HTMLElement).dataset.index);
        if (!isNaN(idx)) {
          // Stage B3 teardown: HLS manifest preload / pool registration removed.

          
          pendingIndexRef.current = idx;
          if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
          debounceTimerRef.current = setTimeout(() => {
            if (pendingIndexRef.current !== null) {
              // Guard against end-card setting index beyond posts array
              const safeIdx = Math.min(pendingIndexRef.current, postsLengthRef.current - 1);
              if (safeIdx < 0) return;
              if (onActiveIndexChangeRef.current) {
                onActiveIndexChangeRef.current(safeIdx);
              } else {
                setActiveIndex(safeIdx);
              }
              if (hasNextPageRef.current && safeIdx >= postsLengthRef.current - NEAR_END_THRESHOLD) {
                onNearEndRef.current();
              }
              pendingIndexRef.current = null;
            }
          }, ACTIVE_INDEX_DEBOUNCE_MS);
        }
      }
    }, { threshold: INTERSECTION_THRESHOLDS });

    slideRefs.current.forEach((el) => {
      observerRef.current?.observe(el);
    });

    return () => {
      observerRef.current?.disconnect();
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, [setActiveIndex]);

  // Stage B3 teardown: fullscreen HLS-pool pruning removed (no pool anymore).




  // ── Register/unregister slide refs ──
  const setSlideRef = useCallback((idx: number, el: HTMLDivElement | null) => {
    if (el) {
      slideRefs.current.set(idx, el);
      observerRef.current?.observe(el);
    } else {
      const old = slideRefs.current.get(idx);
      if (old) observerRef.current?.unobserve(old);
      slideRefs.current.delete(idx);
    }
  }, []);

  // ── Scroll to top when tab changes ──
  const prevTab = useRef(activeTab);
  useEffect(() => {
    if (prevTab.current !== activeTab) {
      containerRef.current?.scrollTo({ top: 0, behavior: 'instant' as any });
      prevTab.current = activeTab;
    }
  }, [activeTab]);

  // ── Pull-to-refresh ──
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const el = containerRef.current;
    if (!el || el.scrollTop > 5) return;
    ptrStartY.current = e.touches[0].clientY;
    ptrActive.current = true;
  }, []);

  const handleTouchEnd = useCallback(async (e: React.TouchEvent) => {
    if (!ptrActive.current) return;
    ptrActive.current = false;
    const delta = e.changedTouches[0].clientY - ptrStartY.current;
    if (delta > PTR_DISTANCE && !isRefreshing) {
      haptic('medium');
      await onRefresh();
    }
  }, [isRefreshing, onRefresh]);

  // ── First frame signal ──
  const handleFirstFrame = useCallback(() => {
    if (!firstFrameFired.current) {
      firstFrameFired.current = true;
      onFirstFrameReady?.();
    }
  }, [onFirstFrameReady]);

  // ── Zoom change handler from child slides ──
  const handleZoomChange = useCallback((isZoomed: boolean) => {
    setAnySlideZoomed(isZoomed);
  }, []);

  // ── scrollend safety fallback (fires once after snap settles) ──
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const onScrollEnd = () => {
      const slideHeight = el.clientHeight;
      if (slideHeight === 0) return;
      const idx = Math.round(el.scrollTop / slideHeight);
      const safeIdx = Math.min(idx, postsLengthRef.current - 1);
      if (safeIdx < 0) return;
      if (onActiveIndexChangeRef.current) {
        onActiveIndexChangeRef.current(safeIdx);
      } else {
        setActiveIndex(safeIdx);
      }
    };

    el.addEventListener('scrollend', onScrollEnd, { passive: true });
    return () => el.removeEventListener('scrollend', onScrollEnd);
  }, [setActiveIndex]);

  // ── Prefetch ahead: poster IMAGES (cheap, no decoder) + next 2 manifests ──
  useEffect(() => {
    // Crisp first-frame posters — warm 5 ahead; images cost no decoder budget.
    const posters = postsRef.current.slice(activeIndex + 1, activeIndex + 6);
    posters.forEach(post => {
      const thumb = post?.mediaItems?.[0]?.thumbnailUrl;
      if (thumb) { const img = new Image(); img.src = thumb; }
    });
    // Manifests removed (Stage B3 teardown) — posters only.
  }, [activeIndex]);




  // ── Editorial card sentinel observer ──
  const setIsTournamentCardActive = useClubhouseStore(s => s.setIsTournamentCardActive);

  // Stable key that changes only when editorial cards enter/leave/reorder.
  // Avoids re-binding the observer on every like/comment update.
  const editorialCardKey = useMemo(
    () => posts
      .filter(p =>
        p.postType === 'pga_card' ||
        p.postType === 'tournament_result' ||
        p.postType === 'course_of_week_card'
      )
      .map(p => p.id)
      .join('|'),
    [posts]
  );

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const visibleSet = new Set<Element>();
    const observedSet = new Set<Element>();

    const syncSentinelVisibility = (sentinel: Element) => {
      const rect = sentinel.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();
      const visibleTop = Math.max(rect.top, containerRect.top);
      const visibleBottom = Math.min(rect.bottom, containerRect.bottom);
      const visibleHeight = Math.max(0, visibleBottom - visibleTop);
      const ratio = rect.height > 0 ? visibleHeight / rect.height : 0;

      if (ratio >= 0.85) {
        visibleSet.add(sentinel);
      } else {
        visibleSet.delete(sentinel);
      }
    };

    const publishVisibility = () => {
      setIsTournamentCardActive(visibleSet.size > 0);
    };

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.85) {
            visibleSet.add(entry.target);
          } else {
            visibleSet.delete(entry.target);
          }
        }
        publishVisibility();
      },
      { root: container, threshold: [0, 0.85] }
    );

    // Reconcile observer attachments without forcing layout on existing sentinels.
    // IO will fire within a frame for newly-attached targets with the correct state.
    const reconcileSentinels = () => {
      const sentinels = Array.from(container.querySelectorAll("[data-pga-sentinel='true']"));
      const currentSet = new Set<Element>(sentinels);

      observedSet.forEach((sentinel) => {
        if (!currentSet.has(sentinel)) {
          observer.unobserve(sentinel);
          observedSet.delete(sentinel);
          visibleSet.delete(sentinel);
        }
      });

      sentinels.forEach((sentinel) => {
        if (!observedSet.has(sentinel)) {
          observedSet.add(sentinel);
          observer.observe(sentinel);
          // No syncSentinelVisibility here — let IO publish the correct state.
        }
      });

      if (sentinels.length === 0) {
        visibleSet.clear();
        publishVisibility();
      }
    };

    // Initial seed — synchronous measurement to kill first-mount / return-to-page flash.
    const initialSentinels = Array.from(container.querySelectorAll("[data-pga-sentinel='true']"));
    initialSentinels.forEach((sentinel) => {
      observedSet.add(sentinel);
      observer.observe(sentinel);
      syncSentinelVisibility(sentinel);
    });
    publishVisibility();

    // SnapFeed virtualizes slides, so editorial sentinels mount later as the user
    // scrolls into the active window. Watch direct child mount/unmount on the
    // scroll container (subtree:false avoids reacting to descendant noise like
    // like animations or video buffer mutations) and coalesce per frame.
    let rafId: number | null = null;
    const mutationObserver = new MutationObserver(() => {
      if (rafId !== null) return;
      rafId = requestAnimationFrame(() => {
        rafId = null;
        reconcileSentinels();
      });
    });

    mutationObserver.observe(container, { childList: true, subtree: false });

    return () => {
      if (rafId !== null) cancelAnimationFrame(rafId);
      mutationObserver.disconnect();
      observer.disconnect();
    };
  }, [editorialCardKey, setIsTournamentCardActive]);

  // Dev-only invariant: SnapFeed keys slides by post.id. Callers MUST pass a
  // grouped-by-post array (apply groupMultiMedia upstream). If a duplicate id
  // surfaces, surface it loudly so the buggy pipeline is fixed at its source
  // rather than silently dropping media via a defensive dedup here.
  if (process.env.NODE_ENV !== 'production') {
    const ids = posts.map(p => p.id);
    if (new Set(ids).size !== ids.length) {
      // eslint-disable-next-line no-console
      console.error(
        '[SnapFeed] Ungrouped posts array received — caller must apply groupMultiMedia() before open(). Duplicate ids:',
        ids,
      );
    }
  }




  return (
    <div
      ref={containerRef}
      data-snap-feed
      className="absolute inset-0 overflow-y-auto"
      style={{
        scrollSnapType: anySlideZoomed ? 'none' : 'y mandatory',
        WebkitOverflowScrolling: 'touch',
        overscrollBehavior: 'none',
        scrollbarWidth: 'none',
        msOverflowStyle: 'none',
      }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {posts.map((post, idx) => {
        const distance = Math.abs(idx - activeIndex);
        const isInWindow = distance <= VIRTUAL_WINDOW;

        if (!isInWindow) {
          // Content-aware placeholder: render the post's thumbnail behind a
          // dark scrim so a briefly-visible placeholder reads as "loading"
          // rather than a black flicker. Lazy via CSS background-image.
          const thumbnail = post.mediaItems?.[0]?.thumbnailUrl;
          return (
            <div
              key={post.id}
              ref={(el) => setSlideRef(idx, el)}
              data-index={idx}
              data-placeholder="virtual"
              className="relative w-full flex-shrink-0"
              style={{
                // 100dvh is safe here BECAUSE the Median status-bar overlay
                // flag is boot-locked once (see ensureStatusBarOverlayBooted
                // in useMedianStatusBar.ts). No transition ever re-sends
                // overlay:true, so the WebView viewport does not resize
                // mid-animation and dvh does not re-resolve during fs.open.
                // Do NOT reintroduce overlay-flag toggles on any hot path.
                height: '100dvh',
                scrollSnapAlign: 'start',
                scrollSnapStop: 'always',
                background: thumbnail
                  ? `#000 url(${thumbnail}) center / cover no-repeat`
                  : '#000',
              }}
            >
              <div
                aria-hidden
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'rgba(0, 0, 0, 0.65)',
                  pointerEvents: 'none',
                }}
              />
            </div>
          );
        }

        return (
          <FeedSlide
            key={post.id}
            post={post}
            index={idx}
            setRef={(el) => setSlideRef(idx, el)}
            activeTab={activeTab}
            followOverrides={followOverrides}
            onFollowChange={onFollowChange}
            onFirstFrameReady={idx === (startIndex ?? 0) ? handleFirstFrame : undefined}
            onLike={onLike}
            onComment={onComment}
            onShare={onShare}
            getLikeState={getLikeState}
            getCommentCount={getCommentCount}
            onZoomChange={handleZoomChange}
            activeIndexOverride={activeIndexOverride}
            isFullscreen={isFullscreen}
            mediaIndex={idx === (startIndex ?? 0) ? openingMediaIndex : 0}
            mediaId={idx === (startIndex ?? 0) ? openingMediaId : null}
          />
        );
      })}

      {!hasNextPage && posts.length > 0 && (
        <div
          data-index={posts.length}
          data-feed-ended
          className="w-full flex-shrink-0 flex flex-col items-center justify-center"
          style={{
            height: '100dvh',
            scrollSnapAlign: 'start',
            scrollSnapStop: 'always',
            padding: '0 44px',
            background: '#000',
          }}
        >
          <div
            style={{
              width: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
            }}
          >
            <img
              src={clbhouzLogo}
              alt="clbhouz"
              style={{ height: 46, width: 'auto', objectFit: 'contain' }}
            />
            <div
              style={{
                marginTop: 16,
                fontSize: 20,
                fontWeight: 700,
                letterSpacing: '-0.02em',
                color: '#fff',
                lineHeight: 1.2,
              }}
            >
              You're all caught up
            </div>
            <div
              style={{
                marginTop: 6,
                maxWidth: 260,
                fontSize: 12.5,
                fontWeight: 500,
                color: 'rgba(255,255,255,0.5)',
                lineHeight: 1.55,
              }}
            >
              New posts from your group will land here first.
            </div>
            <button
              type="button"
              onClick={() => openInviteSheet('feed_end')}
              style={{
                marginTop: 20,
                padding: '11px 24px',
                borderRadius: 999,
                background: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,255,255,0.18)',
                backdropFilter: 'blur(6px)',
                WebkitBackdropFilter: 'blur(6px)',
                color: '#fff',
                fontSize: 13,
                fontWeight: 700,
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              Invite friends
            </button>
            <button
              type="button"
              onClick={() => containerRef.current?.scrollTo({ top: 0, behavior: 'smooth' })}
              style={{
                marginTop: 12,
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                fontSize: 12.5,
                fontWeight: 600,
                color: 'rgba(255,255,255,0.5)',
                fontFamily: 'inherit',
              }}
            >
              Back to top
            </button>
          </div>
        </div>
      )}

    </div>
  );
}

export default SnapFeed;

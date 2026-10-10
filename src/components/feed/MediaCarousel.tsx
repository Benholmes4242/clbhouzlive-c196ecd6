/**
 * MediaCarousel — Phase 2 multi-media carousel for FeedCard.
 *
 * Rules from the brief:
 *  - Stable card height: ONE fixed 4:5 frame ratio for all slides so the
 *    card height never jumps as you swipe.
 *  - Every slide is `object-fit: cover` / `object-position: center` into the
 *    shared frame: a portrait taller than the frame is centre-cropped, never
 *    letterboxed. The full frame is one tap away in the fullscreen viewer.
 *  - `maxHeight` caps the frame against the viewport (feed budget) so the
 *    course band + actions row stay above the floating nav.
 *  - Dots overlay bottom-centre (`CarouselDots`) are the sole indicator.
 *  - Swipe + tap a dot navigates. Active index persisted in
 *    `clubhouseStore.carouselPositions` keyed by post index.
 *  - Inline video lifecycle: only the active slide may autoplay.
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { postImageProps } from '@/utils/imageSrc';
import type { MediaItem } from '@/components/media-system/types/media';
import { CarouselDots } from '@/components/media/CarouselDots';
import { InlineVideo } from './InlineVideo';
import { createTapHandler } from './mediaTap';
import { isPerfEnabled } from '@/perf/navTiming';
import { VideoEngine } from '@/video/VideoEngine';
import { feedLaneRoles, carouselNeighbourOverride } from '@/video/feedLaneRoles';
import { PrefetchController } from '@/video/PrefetchController';
import type { LaneId } from '@/video/lanePolicy';
import { SLAB } from './feedSurfaces';


interface Props {
  items: MediaItem[];
  isCardActive: boolean;
  initialIndex: number;
  frameRatio?: number; // default 4/5
  /**
   * Viewport cap for the frame (CSS length, e.g. the feed's
   * `max(280px, calc(100svh - ...))`). Applied as maxHeight on the frame so
   * the band + actions row stay above the floating nav. ALL slides share this
   * one height — the frame owns it, slides cover-crop into it.
   */
  maxHeight?: string;
  /** When false, video slides render their poster only (no <video> element). */
  mountVideo?: boolean;
  /**
   * Post id — threaded to InlineVideo so each video slide gets a stable
   * media-level ownership key (`${postId}:${i}`). Required so the VideoEngine
   * owner-guard engages on card-to-card handoff (no null callers).
   */
  postId?: string | null;
  onIndexChange?: (idx: number) => void;
  /**
   * Fired on single-tap. `originEl` is the tapped slide's host element (the
   * same element InlineVideo registers under `ownerKey` for FLIP handoff).
   * `ownerKey` is the per-slide key `${postId}:${i}` — thread it up so the
   * borrow check can match the tapped slide exactly.
   */
  onOpen: (
    mediaIndex: number,
    mediaId?: string | null,
    originEl?: HTMLElement | null,
    ownerKey?: string | null,
  ) => void;
  /** Double-tap on any slide → like + heart burst (owner: FeedCard). */
  onDoubleTap?: () => void;
}

const FRAME_DEFAULT = 4 / 5;

const supportsScrollEnd =
  typeof window !== 'undefined' && 'onscrollend' in window;

export const MediaCarousel: React.FC<Props> = ({
  items,
  isCardActive,
  initialIndex,
  frameRatio = FRAME_DEFAULT,
  maxHeight,
  mountVideo = false,
  postId,
  onIndexChange,
  onOpen,
  onDoubleTap,
}) => {
  const trackRef = useRef<HTMLDivElement | null>(null);
  const slideRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const [active, setActive] = useState(() =>
    Math.max(0, Math.min(initialIndex || 0, items.length - 1)),
  );
  const rafRef = useRef<number | null>(null);
  /** The index last published on settle — owns the 'active' lane role. */
  const [settled, setSettled] = useState(active);

  // Jump to initial index on mount (without smooth-scroll)
  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    const w = el.clientWidth;
    if (w > 0) {
      el.scrollTo({ left: active * w, behavior: 'auto' });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const settleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isCardActiveRef = useRef(isCardActive);
  isCardActiveRef.current = isCardActive;
  const publishedRef = useRef<number>(active);
  const onIndexChangeRef = useRef(onIndexChange);
  onIndexChangeRef.current = onIndexChange;
  const publishIfSettled = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    const w = el.clientWidth;
    if (w <= 0) return;
    const idx = Math.round(el.scrollLeft / w);
    // Settled = within 1px of a slide boundary.
    if (Math.abs(el.scrollLeft - idx * w) > 1) return;
    const safe = Math.max(0, Math.min(idx, items.length - 1));
    if (safe === publishedRef.current) return;
    const from = publishedRef.current;
    /* §3 — ROTATE ON SETTLE, never on the halfway flip. A one-step move onto a
       VIDEO slide promotes the lane that was warming it ('next' / 'prev') to
       'active' — pure bookkeeping, so InlineVideo resolves the same physical
       lane and nothing reloads. No rotation onto an image, on a multi-slide
       jump (dot tap), off-card, or while a fullscreen borrow holds a frozen lane. */
    const step = safe - from;
    if (
      isCardActiveRef.current &&
      Math.abs(step) === 1 &&
      items[safe]?.type === 'video' &&
      feedLaneRoles.snapshot().frozen.length === 0
    ) {
      const dir: 'down' | 'up' = step > 0 ? 'down' : 'up';
      const recycledLane = feedLaneRoles.rotate(dir);
      if (isPerfEnabled()) {
        // eslint-disable-next-line no-console
        console.info('[CAROUSEL2] rotate', { from, to: safe, dir, recycledLane });
      }
    }
    publishedRef.current = safe;
    setSettled(safe);
    onIndexChangeRef.current?.(safe);
  }, [items]);

  const handleScroll = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      const w = el.clientWidth;
      if (w <= 0) return;
      const idx = Math.round(el.scrollLeft / w);
      const safe = Math.max(0, Math.min(idx, items.length - 1));
      // Local flip at the halfway point (dots + ±1 video roles flip early).
      if (safe !== active) setActive(safe);
    });
    // Store publish waits for settle: 'scrollend' where supported, else a
    // 120ms debounce after the last scroll event.
    if (!supportsScrollEnd) {
      if (settleTimerRef.current) clearTimeout(settleTimerRef.current);
      settleTimerRef.current = setTimeout(publishIfSettled, 120);
    }
  }, [active, items.length, publishIfSettled]);

  useEffect(() => {
    const el = trackRef.current;
    if (!el || !supportsScrollEnd) return;
    el.addEventListener('scrollend', publishIfSettled);
    return () => el.removeEventListener('scrollend', publishIfSettled);
  }, [publishIfSettled]);

  useEffect(() => () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (settleTimerRef.current) clearTimeout(settleTimerRef.current);
  }, []);

  // [CAROUSEL] instrumentation — observable slide switches within a post.
  // Gated on isPerfEnabled(); zero behaviour change.
  const prevActiveRef = useRef<number>(active);
  // Timer holder for the [CAROUSEL2] +500ms active.health sample.
  const activateHealthTimerRef = useRef<{ id: number } | null>(null);
  const ownerKeyOf = useCallback(
    (i: number) =>
      postId ? `${postId}:${i}` : `${items[i]?.id ?? 'noid'}:${i}`,
    [postId, items],
  );
  useEffect(() => {
    if (!isPerfEnabled()) {
      prevActiveRef.current = active;
      return;
    }
    const from = prevActiveRef.current;
    const to = active;
    const fromItem = items[from];
    const toItem = items[to];
    const toMediaType: 'video' | 'image' =
      toItem?.type === 'video' ? 'video' : 'image';
    if (from !== to) {
      // eslint-disable-next-line no-console
      console.info('[CAROUSEL] slide.change', {
        postId,
        fromIndex: from,
        toIndex: to,
        fromOwnerKey: ownerKeyOf(from),
        toOwnerKey: ownerKeyOf(to),
        toMediaType,
        totalSlides: items.length,
      });
      if (fromItem?.type === 'video') {
        // eslint-disable-next-line no-console
        console.info('[CAROUSEL] slide.video', {
          ownerKey: ownerKeyOf(from),
          index: from,
          action: 'pause',
          reason: 'carousel.swipe-out',
        });
      }
      if (toItem?.type === 'video') {
        // eslint-disable-next-line no-console
        console.info('[CAROUSEL] slide.video', {
          ownerKey: ownerKeyOf(to),
          index: to,
          action: 'play',
          reason: 'carousel.swipe-in',
        });
      }
    }
    if (isCardActive) {
      // eslint-disable-next-line no-console
      console.info('[CAROUSEL] slide.activate', {
        postId,
        index: to,
        ownerKey: ownerKeyOf(to),
        mediaType: toMediaType,
        isCardActive,
        prefetched: PrefetchController.wasPrefetched(ownerKeyOf(to)),
        warm: (() => {
          try {
            const laneId = feedLaneRoles.laneForRole('active');
            const bound = VideoEngine.snapshot(laneId).postId;
            return bound === ownerKeyOf(to);
          } catch {
            return false;
          }
        })(),
      });
      // Mismatch guard: on the MEDIA axis, if the active feed lane is bound
      // to a different ownerKey/postId than the slide we just activated, we
      // are about to render the wrong media in this slot. Best-effort — only
      // logs when the engine has a concrete bound postId to compare against.
      if (toItem?.type === 'video') {
        try {
          const laneId = feedLaneRoles.laneForRole('active');
          const bound = VideoEngine.snapshot(laneId).postId;
          const expected = ownerKeyOf(to);
          if (
            bound &&
            bound !== expected &&
            bound !== postId &&
            !bound.startsWith(`${postId ?? ''}:`)
          ) {
            // eslint-disable-next-line no-console
            console.warn('[CAROUSEL] slide.mismatch', {
              expectedOwnerKey: expected,
              boundLanePostId: bound,
              index: to,
            });
          } else if (bound && postId && bound.startsWith(`${postId}:`) && bound !== expected) {
            // Same post, wrong slide index bound to the active lane.
            // eslint-disable-next-line no-console
            console.warn('[CAROUSEL] slide.mismatch', {
              expectedOwnerKey: expected,
              boundLanePostId: bound,
              index: to,
            });
          }
        } catch {
          /* engine not booted — ignore */
        }
      }
    }
    prevActiveRef.current = to;

    // ── [CAROUSEL2] deep lane/role instrumentation ─────────────────
    // Pure logging, gated on isPerfEnabled(). Shows the 3 physical feed
    // lanes' bindings, each slide's role/lane/readiness, and warm outcomes.
    if (isCardActive && isPerfEnabled()) {
      const FEED_LANES: LaneId[] = ['feed-active', 'feed-next', 'feed-prev'];
      const findLaneForOwner = (owner: string) => {
        for (const lid of FEED_LANES) {
          try {
            const s = VideoEngine.snapshot(lid);
            if (s.postId === owner) return { laneId: lid, snap: s };
          } catch { /* engine not booted */ }
        }
        return null;
      };
      const roles = feedLaneRoles.snapshot();
      const snapPost = (lid: LaneId): string | null => {
        try { return VideoEngine.snapshot(lid).postId; } catch { return null; }
      };
      const activeOwner = ownerKeyOf(to);
      const activeLoc = findLaneForOwner(activeOwner);
      // eslint-disable-next-line no-console
      console.info('[CAROUSEL2] lanes', {
        activeSlideIndex: to,
        laneRoles: {
          active: snapPost(roles.active),
          next: snapPost(roles.next),
          prev: snapPost(roles.prev),
        },
        activeSlideLaneId: activeLoc?.laneId ?? null,
        activeSlideOwnerKey: activeOwner,
      });

      const emitSlideLaneState = (idx: number) => {
        if (idx < 0 || idx >= items.length) return;
        const it = items[idx];
        const owner = ownerKeyOf(idx);
        const loc = findLaneForOwner(owner);
        const role = loc ? feedLaneRoles.roleForLane(loc.laneId) : null;
        // eslint-disable-next-line no-console
        console.info('[CAROUSEL2] slide.laneState', {
          index: idx,
          ownerKey: owner,
          role,
          laneId: loc?.laneId ?? null,
          mounted: !!loc,
          firstFrame: loc?.snap.firstFrame ?? false,
          readyState: loc?.snap.readyState ?? 0,
          isVideo: it?.type === 'video',
        });
      };
      emitSlideLaneState(to - 1);
      emitSlideLaneState(to);
      emitSlideLaneState(to + 1);

      const sampleHealth = (label: string) => {
        const loc = findLaneForOwner(activeOwner);
        // eslint-disable-next-line no-console
        console.info('[CAROUSEL2] active.health', {
          when: label,
          ownerKey: activeOwner,
          laneId: loc?.laneId ?? null,
          firstFrame: loc?.snap.firstFrame ?? false,
          playing: loc?.snap.state === 'playing',
          readyState: loc?.snap.readyState ?? 0,
        });
      };
      sampleHealth('activate');
      const t = window.setTimeout(() => sampleHealth('+500ms'), 500);
      // Cleanup handled by effect return below.
      (activateHealthTimerRef.current ??= { id: 0 }).id = t;
    }
  }, [active, isCardActive, items, postId, ownerKeyOf]);

  // Cleanup the [CAROUSEL2] health-sample timer on unmount.
  useEffect(() => () => {
    if (activateHealthTimerRef.current?.id) {
      window.clearTimeout(activateHealthTimerRef.current.id);
    }
  }, []);

  // ────────────────────────────────────────────────────────────────────
  // Adjacent-slide warming (media axis).
  // For the active slide `i`, cache-warm i±1 VIDEO slides via
  // PrefetchController. Distinct per-slide keys (${postId}:${j}) — same
  // convention InlineVideo binds under, so the browser HTTP cache is
  // primed for the exact hlsUrl hls.js will fetch on activation.
  //
  // Budget: only i±1 (max 2 warm requests on the horizontal axis) on top
  // of the active slide — total ≤ 3, within the 3-lane pool (feed
  // active/next/prev). PrefetchController itself caps in-flight at 2 and
  // skips when any lane is buffering, so cannot stall the active video.
  // Adjacent-slide MOUNT/warm inside InlineVideo (isNear/earlyMotion)
  // is handled below on the render pass — this effect covers the pure
  // HTTP-cache priming that mirrors the vertical feed's next-card warm.
  // ────────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isCardActive) return;
    const perf = isPerfEnabled();
    const isAnyLaneLoading = (() => {
      try { return VideoEngine.isAnyLaneLoading(); } catch { return false; }
    })();
    const neighbours = [active - 1, active + 1];
    for (const j of neighbours) {
      if (j < 0 || j >= items.length) continue;
      const it = items[j];
      const owner = ownerKeyOf(j);
      // Mount warm attempt (InlineVideo isNear/earlyMotion render below).
      if (perf) {
        if (it?.type !== 'video') {
          // eslint-disable-next-line no-console
          console.info('[CAROUSEL2] warm.attempt', {
            ownerKey: owner, method: 'mount',
            outcome: 'noop:not-video', isAnyLaneLoading,
          });
        } else {
          // eslint-disable-next-line no-console
          console.info('[CAROUSEL2] warm.attempt', {
            ownerKey: owner, method: 'mount',
            outcome: 'issued', isAnyLaneLoading,
          });
        }
      }
      // Prefetch warm attempt.
      if (!it || it.type !== 'video') {
        if (perf) {
          // eslint-disable-next-line no-console
          console.info('[CAROUSEL2] warm.attempt', {
            ownerKey: owner, method: 'prefetch',
            outcome: 'noop:not-video', isAnyLaneLoading,
          });
        }
        continue;
      }
      const hlsUrl = (it as any).hlsUrl || '';
      if (!hlsUrl || typeof hlsUrl !== 'string' || hlsUrl.startsWith('blob:')) {
        if (perf) {
          // eslint-disable-next-line no-console
          console.info('[CAROUSEL2] warm.attempt', {
            ownerKey: owner, method: 'prefetch',
            outcome: 'noop:no-hls-url', isAnyLaneLoading,
          });
        }
        continue;
      }
      if (perf) {
        const already = PrefetchController.wasPrefetched(owner);
        const outcome = already
          ? 'noop:already-warmed'
          : (isAnyLaneLoading ? 'skipped:laneLoading' : 'issued');
        // eslint-disable-next-line no-console
        console.info('[CAROUSEL2] warm.attempt', {
          ownerKey: owner, method: 'prefetch',
          outcome, isAnyLaneLoading,
        });
      }
      PrefetchController.request(owner, hlsUrl);
    }
  }, [active, isCardActive, items, ownerKeyOf]);

  /* §2 — PUBLISH WHICH LANES THIS CAROUSEL OWNS, on the SETTLED index (the
     same moment the roles rotate), so CardFeed's card-level warm steps aside
     for a video neighbour and takes the lane back at either end. */
  useEffect(() => {
    if (!postId) return;
    if (!isCardActive || !mountVideo) {
      carouselNeighbourOverride.clear(postId);
      return;
    }
    const hasVideo = (j: number) => {
      const it = items[j];
      const u = (it as any)?.hlsUrl;
      return it?.type === 'video' && typeof u === 'string' && !!u && !u.startsWith('blob:');
    };
    carouselNeighbourOverride.set({
      postId,
      activeIndex: settled,
      next: hasVideo(settled + 1),
      prev: hasVideo(settled - 1),
    });
    /* §1 — CAROUSEL WARM, mirroring CardFeed's. Keyed on the SETTLED index,
       never the halfway flip: until the swipe settles and roles rotate, the
       'next' lane is still decoding the incoming slide and must not be
       re-pointed. Non-video neighbours and out-of-range slides: no preload. */
    const perf = isPerfEnabled();
    for (const j of [settled - 1, settled + 1]) {
      if (j < 0 || j >= items.length || !hasVideo(j)) continue;
      const it = items[j] as any;
      const role: 'next' | 'prev' = j > settled ? 'next' : 'prev';
      const owner = `${postId}:${j}`;
      try {
        VideoEngine.preload(feedLaneRoles.laneForRole(role), {
          hlsUrl: it.hlsUrl,
          posterUrl: it.thumbnailUrl ?? null,
          postId: owner,
          expectedActiveOwnerKey: `${postId}:${settled}`,
        });
        if (perf) {
          // eslint-disable-next-line no-console
          console.info('[CAROUSEL2] warm.attempt', {
            ownerKey: owner, method: 'preload', role, outcome: 'issued:preload',
          });
        }
      } catch { /* engine not booted — safe to ignore */ }
    }
  }, [postId, isCardActive, mountVideo, items, settled]);
  useEffect(() => () => { if (postId) carouselNeighbourOverride.clear(postId); }, [postId]);





  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        aspectRatio: String(frameRatio),
        maxHeight,
        background: SLAB,
        overflow: 'hidden',
      }}
    >
      <div
        ref={trackRef}
        onScroll={handleScroll}
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          overflowX: 'auto',
          overflowY: 'hidden',
          scrollSnapType: 'x mandatory',
          scrollBehavior: 'smooth',
          overscrollBehaviorX: 'contain',
          WebkitOverflowScrolling: 'touch',
          scrollbarWidth: 'none',
        }}
      >
        {items.map((m, i) => {
          const url = m.imageUrl || m.thumbnailUrl || '';
          const isVideo = m.type === 'video';
          /* BRIEF_CAROUSEL_NEIGHBOUR_WARM §3/§4 — the feed's grammar: the
             SETTLED slide holds 'active'; the slide the swipe is heading into
             (halfway flip, `active`) plays early on the lane already warming
             it ('next' / 'prev'), exactly like CardFeed's earlyIdx. Making it
             isActive at the halfway point would resolve the 'active' lane
             (still the outgoing slide's) and cold-load there — the poster
             flash. The settled neighbours are bound but paused (isNear only). */
          const isActiveSlide = isCardActive && i === settled;
          const isIncomingSlide =
            isCardActive && i === active && active !== settled;
          const isAdjacentSlide =
            isCardActive && !isActiveSlide && Math.abs(i - settled) === 1;
          const slideOwnerKey = postId
            ? `${postId}:${i}`
            : `${m.id ?? 'noid'}:${i}`;
          const emitOpen = (el: HTMLButtonElement | null) =>
            onOpen(i, items[i]?.id ?? null, el, slideOwnerKey);
          const handleTap = createTapHandler({
            onSingle: (e) => {
              e.stopPropagation();
              emitOpen(slideRefs.current[i] ?? (e.currentTarget as HTMLButtonElement));
            },
            onDouble: (e) => { e.stopPropagation(); onDoubleTap?.(); },
          });
          return (
            <button
              type="button"
              key={m.id || i}
              ref={(el) => { slideRefs.current[i] = el; }}
              onClick={
                onDoubleTap
                  ? handleTap
                  : (e) => {
                      e.stopPropagation();
                      emitOpen(slideRefs.current[i] ?? (e.currentTarget as HTMLButtonElement));
                    }
              }
              style={{
                flex: '0 0 100%',
                width: '100%',
                height: '100%',
                position: 'relative',
                scrollSnapAlign: 'start',
                scrollSnapStop: 'always',
                background: 'transparent',
                border: 'none',
                padding: 0,
                cursor: 'pointer',
              }}
              aria-label={`Media ${i + 1} of ${items.length}`}
            >
              {isVideo ? (
                mountVideo ? (
                  <InlineVideo
                    item={m}
                    isActive={isActiveSlide}
                    isNear={isActiveSlide || isAdjacentSlide || isIncomingSlide}
                    earlyMotion={isIncomingSlide}
                    postId={postId ?? null}
                    ownerKey={slideOwnerKey}
                    objectFit="cover"
                  />
                ) : m.thumbnailUrl ? (
                  <img
                    src={m.thumbnailUrl}
                    alt=""
                    loading={Math.abs(i - active) <= 1 ? 'eager' : 'lazy'}
                    decoding="async"
                    style={{
                      position: 'absolute',
                      inset: 0,
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      objectPosition: 'center',
                      display: 'block',
                    }}
                  />
                ) : null
              ) : url ? (
                <img
                  {...postImageProps(url)}
                  alt=""
                  loading={Math.abs(i - active) <= 1 ? 'eager' : 'lazy'}
                    decoding="async"
                  style={{
                    position: 'absolute',
                    inset: 0,
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    objectPosition: 'center',
                    display: 'block',
                  }}
                />
              ) : null}
            </button>
          );
        })}
      </div>

      {/* Dots */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 10,
          display: 'flex',
          justifyContent: 'center',
          pointerEvents: 'none',
        }}
      >
        <CarouselDots count={items.length} active={active} />
      </div>
    </div>
  );
};

MediaCarousel.displayName = 'MediaCarousel';

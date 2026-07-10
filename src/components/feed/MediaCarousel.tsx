/**
 * MediaCarousel — Phase 2 multi-media carousel for FeedCard.
 *
 * Rules from the brief:
 *  - Stable card height: ONE fixed 4:5 frame ratio for all slides so the
 *    card height never jumps as you swipe.
 *  - Per-slide no-crop ambient fill: a blurred, scaled copy of the slide
 *    fills the frame behind it, then the slide is `object-fit: contain`
 *    on top. Wide and tall in the same post both show whole, no bars.
 *  - Dots overlay bottom-centre (`CarouselDots`), `n/total` chip top-right.
 *  - Swipe + tap a dot navigates. Active index persisted in
 *    `clubhouseStore.carouselPositions` keyed by post index.
 *  - Inline video lifecycle: only the active slide may autoplay.
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { MediaItem } from '@/components/media-system/types/media';
import { CarouselDots } from '@/components/media/CarouselDots';
import { InlineVideo } from './InlineVideo';
import { createTapHandler } from './mediaTap';
import { isPerfEnabled } from '@/perf/navTiming';
import { VideoEngine } from '@/video/VideoEngine';
import { feedLaneRoles } from '@/video/feedLaneRoles';
import { PrefetchController } from '@/video/PrefetchController';


interface Props {
  items: MediaItem[];
  isCardActive: boolean;
  initialIndex: number;
  frameRatio?: number; // default 4/5
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

export const MediaCarousel: React.FC<Props> = ({
  items,
  isCardActive,
  initialIndex,
  frameRatio = FRAME_DEFAULT,
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

  const handleScroll = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      const w = el.clientWidth;
      if (w <= 0) return;
      const idx = Math.round(el.scrollLeft / w);
      const safe = Math.max(0, Math.min(idx, items.length - 1));
      if (safe !== active) {
        setActive(safe);
        onIndexChange?.(safe);
      }
    });
  }, [active, items.length, onIndexChange]);

  useEffect(() => () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
  }, []);

  // [CAROUSEL] instrumentation — observable slide switches within a post.
  // Gated on isPerfEnabled(); zero behaviour change.
  const prevActiveRef = useRef<number>(active);
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
  }, [active, isCardActive, items, postId, ownerKeyOf]);

  // ────────────────────────────────────────────────────────────────────
  // Adjacent-slide warming (media axis) — TWO cooperating mechanisms.
  //
  // 1. HTTP-cache prefetch (PrefetchController): primes the browser cache
  //    for i±1 hlsUrls so hls.js hits cache on activation. Uses
  //    `allowWhileLoading: true` — carousel warms are same-card and MUST
  //    fire even while the active slide's HLS is loading (otherwise every
  //    neighbour request is dropped by the laneLoading gate). saveData /
  //    slow-net skips still apply inside PrefetchController.
  //
  // 2. Lane CLAIM (VideoEngine.preload): stamps the `next` / `prev`
  //    physical feed lanes with the neighbour ownerKey so InlineVideo's
  //    detectRoleForMatch resolves for i±1 (which have never been mounted
  //    before). This is what makes the isNear/earlyMotion mount-warm
  //    actually mount — without a lane bound to the neighbour's ownerKey,
  //    detectRoleForMatch returns null and useVideoLane no-ops.
  //
  // Budget: only i±1 (max 2 warm requests + 2 lane claims) on top of the
  // active slide — total ≤ 3 lanes, matching the 3-lane feed pool
  // (active/next/prev). Multi-video carousels temporarily borrow the
  // vertical feed's next/prev claims for their own neighbours; CardFeed
  // re-warms next/prev the moment playingIdx moves.
  // ────────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isCardActive) return;
    const claimRoles: Array<{ delta: -1 | 1; role: 'prev' | 'next' }> = [
      { delta: -1, role: 'prev' },
      { delta: 1, role: 'next' },
    ];
    for (const { delta, role } of claimRoles) {
      const j = active + delta;
      if (j < 0 || j >= items.length) continue;
      const it = items[j];
      if (!it || it.type !== 'video') continue;
      const hlsUrl = (it as any).hlsUrl || '';
      if (!hlsUrl || typeof hlsUrl !== 'string' || hlsUrl.startsWith('blob:')) continue;
      const ownerKey = ownerKeyOf(j);
      // (1) HTTP-cache prefetch — bypasses laneLoading gate for same-card warms.
      PrefetchController.request(ownerKey, hlsUrl, { allowWhileLoading: true });
      // (2) Lane claim — stamp the neighbour's ownerKey on the next/prev
      //     physical lane so the adjacent InlineVideo's detectRoleForMatch
      //     resolves and useVideoLane mounts it paused-ready.
      try {
        const laneId = feedLaneRoles.laneForRole(role);
        VideoEngine.preload(laneId, {
          hlsUrl,
          posterUrl: (it as any).thumbnailUrl ?? null,
          postId: ownerKey,
        });
      } catch {
        /* engine not booted — safe to ignore */
      }
    }
  }, [active, isCardActive, items, ownerKeyOf]);





  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        aspectRatio: String(frameRatio),
        background: '#05080F',
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
          WebkitOverflowScrolling: 'touch',
          scrollbarWidth: 'none',
        }}
      >
        {items.map((m, i) => {
          const url = m.imageUrl || m.thumbnailUrl || '';
          const isVideo = m.type === 'video';
          const isActiveSlide = isCardActive && i === active;
          // Adjacent-slide keep-warm: the i±1 slide of the active card mounts
          // its lane paused-but-ready via earlyMotion (role='next'). Bounded
          // to ≤2 warm neighbours per active card — total lanes for a multi-
          // video carousel: i-1 + i + i+1 = 3, matching the feed's 3-lane
          // pool (active/next/prev). Only when the CARD is active.
          const isAdjacentSlide =
            isCardActive && !isActiveSlide && Math.abs(i - active) === 1;
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
                    isNear={isActiveSlide || isAdjacentSlide}
                    /* Carousel neighbours are KEPT-BOUND PAUSED, not early-
                     * playing (unlike vertical feed neighbours). isNear +
                     * the lane claim above give detectRoleForMatch a real
                     * role → useVideoLane mounts paused-ready. earlyMotion
                     * would flip playbackIntent=true and start playback. */
                    earlyMotion={false}
                    postId={postId ?? null}
                    ownerKey={slideOwnerKey}
                    objectFit="cover"
                  />

                ) : m.thumbnailUrl ? (
                  <img
                    src={m.thumbnailUrl}
                    alt=""
                    loading={i === 0 ? 'eager' : 'lazy'}
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
                  src={url}
                  alt=""
                  loading={i === 0 ? 'eager' : 'lazy'}
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

      {/* n/total chip */}
      <div
        style={{
          position: 'absolute',
          top: 10,
          right: 10,
          background: 'rgba(5,8,16,0.55)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          color: '#fff',
          fontSize: 11,
          fontWeight: 600,
          padding: '3px 8px',
          borderRadius: 999,
          fontVariantNumeric: 'tabular-nums',
          pointerEvents: 'none',
        }}
      >
        {active + 1}/{items.length}
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

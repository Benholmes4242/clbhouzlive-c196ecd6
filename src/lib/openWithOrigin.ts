/**
 * Phase 3 shared-element expand transition helper.
 *
 * A single entry point tile openers call at tap time. It synchronously:
 *   1) Snapshots the origin element geometry (rect, radius, aspect, poster).
 *   2) Locks body scroll (ref-counted so it composes with CommentsSheet).
 *   3) Flips the WebView status bar to viewer chrome.
 *   4) Hands off the tile's HLS instance to the pool (so the viewer inherits
 *      the buffered segments and lands playing instantly).
 *   5) Opens the fullscreen feed store with the captured origin so the
 *      overlay can drive the FLIP clone.
 *
 * Deep-link / notification openers that have no source tile continue calling
 * `useFullscreenFeedStore.open(...)` directly — omitting the `origin` option
 * falls back to today's plain opacity fade.
 */
import type { FeedPost } from '@/components/media-system/types/media';
import { useFullscreenFeedStore, type OpenOrigin } from '@/store/fullscreenFeedStore';
import { VideoEngine } from '@/video/VideoEngine';
import { RailLanePool } from '@/video/railLanePool';
import { fsv, fsvNewSession, fsvViewport } from '@/perf/fsvTelemetry';
// [VIDEOSTUB] HLSPoolManager + mobileVideoDebug imports removed — engine severed.


function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  try {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch {
    return false;
  }
}

export function snapshotOrigin(
  el: HTMLElement | null | undefined,
  posterUrl: string | null | undefined,
): OpenOrigin | null {
  if (!el) return null;
  if (prefersReducedMotion()) return null;
  const rect = el.getBoundingClientRect();
  if (rect.width < 4 || rect.height < 4) return null;
  let borderRadius = '0px';
  try {
    borderRadius = getComputedStyle(el).borderRadius || '0px';
  } catch {}
  const aspectRatio = rect.height > 0 ? rect.width / rect.height : 1;
  return {
    rect: { top: rect.top, left: rect.left, width: rect.width, height: rect.height },
    posterUrl: posterUrl ?? null,
    borderRadius,
    aspectRatio,
  };
}

interface OpenWithOriginArgs {
  posts: FeedPost[];
  index: number;
  originEl: HTMLElement | null | undefined;
  posterUrl: string | null | undefined;
  /**
   * Watch tiles rent a `rail-*` lane via `RailLanePool`. Passing the tile's
   * owner key lets us resume fullscreen at that lane's live playhead — so
   * tapping a tile playing at 8s opens fullscreen at 8s, not 0.
   */
  railOwnerKey?: string | null;
  /** Which media within the opening post to render on the opening slide.
   *  Positional fallback — `mediaId` (below) is authoritative because grouping
   *  reorders / dedupes mediaItems. Default 0 → identical behavior for
   *  existing callers. */
  mediaIndex?: number;
  /** Stable media item id — resolved against the grouped post's mediaItems on
   *  the opening slide. Preferred over the positional `mediaIndex`. */
  mediaId?: string | null;
  options?: {
    openCommentsInitially?: boolean;
    initialCommentId?: string | null;
    onClose?: () => void;
    hasNextPage?: boolean;
    fetchNextPage?: () => void;
    isFetchingNextPage?: boolean;
    readOnly?: boolean;
  };
}

export function openWithOrigin({
  posts,
  index,
  originEl,
  posterUrl,
  railOwnerKey,
  mediaIndex,
  mediaId,
  options,
}: OpenWithOriginArgs): void {
  fsvNewSession('open-tap', { index });

  const origin = snapshotOrigin(originEl, posterUrl ?? null);
  const postId = (posts[index] as any)?.id ?? null;

  fsv('tap', {
    postId,
    index,
    hasOriginEl: !!originEl,
    prefersReducedMotion:
      typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches,
    viewport: fsvViewport(),
  });
  fsv('tap.origin', {
    postId,
    origin,
    posterUrl: posterUrl ?? null,
  });

  // Two-way resume: prefer the tile's live rail-lane playhead (Watch tap),
  // then the feed-active lane (Clubhouse tap), then the engine's session
  // lastPos map.
  let startPosition = 0;
  let startSource: 'railLane' | 'feedSnap' | 'lastPos' | 'zero' = 'zero';
  let railLaneCT = -1;
  let feedSnapCT = -1;
  let lastPosCT = -1;
  try {
    if (railOwnerKey) {

      railLaneCT = RailLanePool.getCurrentTime(railOwnerKey);
      if (railLaneCT > 0.1) {
        startPosition = railLaneCT;
        startSource = 'railLane';
      }
    }
    if (startSource === 'zero') {
      const feedSnap = VideoEngine.snapshot('feed-active');
      feedSnapCT = feedSnap.currentTime;
      // Ownership gate: only inherit the feed-active playhead when that
      // lane is currently loaded for THIS post. lane.postId is written raw
      // (either bare postId or `${postId}:${mediaIndex}` ownerKey depending
      // on which entry point wrote last) — match exact OR `${postId}:` prefix.
      const owns =
        feedSnap.postId != null &&
        postId != null &&
        (feedSnap.postId === postId || feedSnap.postId.startsWith(postId + ':'));
      if (owns && feedSnap.currentTime > 0) {
        startPosition = feedSnap.currentTime;
        startSource = 'feedSnap';
      } else if (postId) {
        lastPosCT = VideoEngine.getLastPos(postId);
        startPosition = lastPosCT;
        startSource = 'lastPos';
      }
    }
  } catch {
    /* engine may not be booted yet on deep-link openers */
  }
  fsv('tap.start', {
    postId,
    startPosition: +startPosition.toFixed(3),
    source: startSource,
    railLaneCT: +railLaneCT.toFixed(3),
    feedSnapCT: +feedSnapCT.toFixed(3),
    feedSnapPostId: (() => { try { return VideoEngine.snapshot('feed-active').postId; } catch { return null; } })(),
    lastPosCT: +lastPosCT.toFixed(3),
  });


  // Chrome flip at TAP time (not effect time) to kill the strobe. Scroll
  // lock is owned by the overlay's isOpen effect (ref-counted so it composes
  // cleanly with CommentsSheet stacking on top).
  let statusbarOk = false;
  try {
    (window as any).median?.statusbar?.set({
      style: 'dark',
      color: '00000000',
      overlay: true,
      blur: false,
    });
    statusbarOk = true;
  } catch {}
  fsv('tap.statusbar', { attempted: true, ok: statusbarOk, viewport: fsvViewport() });


  useFullscreenFeedStore.getState().open(posts, index, {
    ...(options ?? {}),
    origin,
    startPosition,
    mediaIndex: mediaIndex ?? 0,
    mediaId: mediaId ?? null,
  });
  fsv('tap.storeOpen', {
    postId, index,
    startPosition: +startPosition.toFixed(3),
    mediaIndex: mediaIndex ?? 0,
    mediaId: mediaId ?? null,
  });
}

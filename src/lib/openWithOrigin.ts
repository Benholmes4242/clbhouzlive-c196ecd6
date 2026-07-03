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
import { HLSPoolManager } from '@/media/HLSPoolManager';
import { logHandoff } from '@/media/mobileVideoDebug';

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
  /** HLS urls to hand off (typically the tapped tile's active url). */
  handOffUrls?: (string | null | undefined)[];
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
  handOffUrls,
  options,
}: OpenWithOriginArgs): void {
  const origin = snapshotOrigin(originEl, posterUrl ?? null);
  const postId = (posts[index] as any)?.id ?? null;

  // TAP boundary — capture the live tile playhead + play-state at tap so we
  // can compare against FS_ATTACH / FS_FIRSTPLAY on the other side.
  try {
    const tileVideo = originEl?.querySelector('video') as HTMLVideoElement | null;
    logHandoff(postId, 'tile', 'TAP', {
      tileT: tileVideo?.currentTime ?? -1,
      paused: tileVideo?.paused ?? null,
      handOffUrl: handOffUrls?.[0] ?? null,
    });
  } catch {}

  // Chrome flip at TAP time (not effect time) to kill the strobe. Scroll
  // lock is owned by the overlay's isOpen effect (ref-counted so it composes
  // cleanly with CommentsSheet stacking on top).
  try {
    (window as any).median?.statusbar?.set({
      style: 'dark',
      color: '00000000',
      overlay: true,
      blur: false,
    });
  } catch {}

  // Buffered handoff (Path A). Detach the live tile decoder without evicting
  // its pool entry so the viewer's promote() inherits the buffered segments.
  // No playhead sync — short looping clips restart naturally on open/close.
  if (handOffUrls) {
    for (const url of handOffUrls) {
      if (!url) continue;
      try { HLSPoolManager.handOff(url); } catch {}
      logHandoff(postId, 'tile', 'HANDOFF_DONE', { url });
    }
  }

  useFullscreenFeedStore.getState().open(posts, index, {
    ...(options ?? {}),
    origin,
  });
}

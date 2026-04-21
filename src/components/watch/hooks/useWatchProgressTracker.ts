import { useEffect, useRef } from 'react';
import type { FeedPost } from '@/components/media-system/types/media';
import { useUcpSignal } from './useUcpSignal';

const COMPLETE_FRACTION = 0.95;
const PROGRESS_DEBOUNCE_MS = 4000;

interface UseWatchProgressTrackerParams {
  userId: string | undefined;
  activeIndex: number;
  posts: FeedPost[];
  /**
   * Returns the SnapFeed container element to scope the active <video>
   * lookup to. When multiple SnapFeed instances are mounted (e.g. Clubhouse
   * inline + fullscreen overlay on top), this prevents cross-surface bleed.
   */
  getContainer?: () => HTMLElement | null;
  /** When false, the tracker no-ops. Defaults to true. */
  enabled?: boolean;
}

/**
 * Source-agnostic watch-progress tracker. Mounted inside SnapFeed so it
 * runs on both Clubhouse Suggested (inline) AND the fullscreen overlay,
 * polling the active <video> every 2s and writing `watched_partial` /
 * `watched_complete` rows to user_content_preferences (debounced 4s).
 *
 * Upserts on (user_id, post_id, signal_type) make repeated writes idempotent.
 */
export function useWatchProgressTracker({
  userId,
  activeIndex,
  posts,
  getContainer,
  enabled = true,
}: UseWatchProgressTrackerParams) {
  const { record } = useUcpSignal(userId);

  const lastWriteAtRef = useRef<number>(0);
  const lastPostIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!enabled || !userId) return;
    const post = posts[activeIndex];
    if (!post) return;

    // Reset write debounce when active post changes
    if (lastPostIdRef.current !== post.id) {
      lastPostIdRef.current = post.id;
      lastWriteAtRef.current = 0;
    }

    const interval = window.setInterval(() => {
      // Skip when the tab/app is backgrounded — videos pause and we don't
      // want bogus writes against stale playback state.
      if (typeof document !== 'undefined' && document.visibilityState !== 'visible') return;

      // Scope the lookup to this SnapFeed instance when a container is provided
      // so multiple stacked SnapFeeds don't cross-target each other's videos.
      const root: ParentNode = getContainer?.() ?? document;
      const activeSlide = root.querySelector(
        `[data-index="${activeIndex}"] video`,
      ) as HTMLVideoElement | null;
      const activeCard =
        activeSlide ?? (root.querySelector('video') as HTMLVideoElement | null);

      if (!activeCard || activeCard.paused) return;
      const current = activeCard.currentTime;
      const total = activeCard.duration;
      if (!isFinite(total) || total < 1) return;

      const now = Date.now();
      if (now - lastWriteAtRef.current < PROGRESS_DEBOUNCE_MS) return;
      lastWriteAtRef.current = now;

      const fraction = current / total;
      const signal = fraction >= COMPLETE_FRACTION ? 'watched_complete' : 'watched_partial';

      record({
        postId: post.id,
        signalType: signal,
        progressSeconds: Math.floor(current),
        totalSeconds: Math.floor(total),
      });
    }, 2000);

    return () => window.clearInterval(interval);
  }, [enabled, userId, posts, activeIndex, record, getContainer]);
}

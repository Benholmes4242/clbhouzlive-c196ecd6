import { useEffect, useRef } from 'react';
import { useFullscreenFeedStore } from '@/store/fullscreenFeedStore';
import { useUcpSignal } from './useUcpSignal';

const COMPLETE_FRACTION = 0.95;
const PROGRESS_DEBOUNCE_MS = 4000;

/**
 * Mounted once inside FullscreenFeedOverlay. Watches the active <video>
 * element in SnapFeed, debounces progress every ~4s, and writes
 * `watched_partial` or `watched_complete` rows to user_content_preferences.
 *
 * Tracks fullscreen-only as confirmed in the Session 3 brief.
 */
export function useWatchProgressTracker(userId: string | undefined) {
  const { isOpen, posts, activeIndex } = useFullscreenFeedStore();
  const { record } = useUcpSignal(userId);

  const lastWriteAtRef = useRef<number>(0);
  const lastPostIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!isOpen || !userId) return;
    const post = posts[activeIndex];
    if (!post) return;

    // Reset write debounce when active post changes
    if (lastPostIdRef.current !== post.id) {
      lastPostIdRef.current = post.id;
      lastWriteAtRef.current = 0;
    }

    const interval = window.setInterval(() => {
      // SnapFeed renders each slide with `data-index={idx}` inside a
      // [data-snap-feed] container. Locate the active slide's video.
      const activeSlide = document.querySelector(
        `[data-snap-feed] [data-index="${activeIndex}"] video`,
      ) as HTMLVideoElement | null;
      const activeCard =
        activeSlide ?? (document.querySelector('[data-snap-feed] video') as HTMLVideoElement | null);

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
  }, [isOpen, userId, posts, activeIndex, record]);
}

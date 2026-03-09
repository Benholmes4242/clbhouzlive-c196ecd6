import { useEffect } from 'react';
import { useMediaStore } from '@/components/media-system/store/mediaStore';

/**
 * Manages app-lifecycle side effects for the Clubhouse feed:
 * - Pause/resume on visibility change (app background/foreground)
 * - Auto-resume on network reconnect
 * - Screen Wake Lock acquisition
 *
 * Accepts an optional getStore resolver for scoped stores (e.g. fullscreen overlay).
 * When omitted, falls back to the global useMediaStore.
 */
export function useClubhouseLifecycle(
  getStore?: () => { activeVideoElement: HTMLVideoElement | null; userPaused: boolean }
) {
  const resolveStore = getStore ?? (() => useMediaStore.getState());

  // Pause/resume on visibility change (app background)
  useEffect(() => {
    const handleVisibilityChange = () => {
      const state = resolveStore();
      const activeEl = state.activeVideoElement;
      if (!activeEl) return;

      if (document.hidden) {
        if (!activeEl.paused) activeEl.pause();
      } else {
        if (activeEl.paused && !state.userPaused) {
          activeEl.play().catch(() => {});
        }
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [resolveStore]);

  // Auto-resume on network reconnect
  useEffect(() => {
    const handleOnline = () => {
      const state = resolveStore();
      const activeEl = state.activeVideoElement;
      if (activeEl && activeEl.paused && !state.userPaused) {
        activeEl.play().catch(() => {});
      }
    };
    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [resolveStore]);

  // Screen Wake Lock
  useEffect(() => {
    let wakeLock: WakeLockSentinel | null = null;

    const acquire = async () => {
      try {
        if ('wakeLock' in navigator) {
          wakeLock = await (navigator as any).wakeLock.request('screen');
        }
      } catch { /* silent — e.g. low battery */ }
    };

    const handleVisibility = () => {
      if (!document.hidden) acquire();
    };

    acquire();
    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      wakeLock?.release().catch(() => {});
    };
  }, []);
}

import { useEffect } from 'react';
import { useMediaStore } from '@/components/media-system/store/mediaStore';

/**
 * Manages app-lifecycle side effects for the Clubhouse feed:
 * - Pause/resume on visibility change (app background/foreground)
 * - Auto-resume on network reconnect
 * - Screen Wake Lock acquisition
 */
export function useClubhouseLifecycle() {
  // Pause/resume on visibility change (app background)
  useEffect(() => {
    const handleVisibilityChange = () => {
      const store = useMediaStore.getState();
      const activeEl = store.activeVideoElement;
      if (!activeEl) return;

      if (document.hidden) {
        if (!activeEl.paused) activeEl.pause();
      } else {
        if (activeEl.paused && !store.userPaused) {
          activeEl.play().catch(() => {});
        }
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  // Auto-resume on network reconnect
  useEffect(() => {
    const handleOnline = () => {
      const store = useMediaStore.getState();
      const activeEl = store.activeVideoElement;
      if (activeEl && activeEl.paused && !store.userPaused) {
        activeEl.play().catch(() => {});
      }
    };
    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, []);

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

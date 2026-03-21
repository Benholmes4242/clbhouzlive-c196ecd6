import { useEffect } from 'react';
// TODO: re-wire mediaStore in Brief 3

/**
 * Manages app-lifecycle side effects for the Clubhouse feed:
 * - Screen Wake Lock acquisition
 *
 * Video pause/resume logic removed — mediaStore deleted in Brief 1.
 * Will be re-wired in Brief 3 with new scroll-snap feed.
 */
export function useClubhouseLifecycle(
  _getStore?: () => { activeVideoElement: HTMLVideoElement | null; userPaused: boolean }
) {
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

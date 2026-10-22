import { useEffect } from 'react';

/**
 * Manages app-lifecycle side effects for the Clubhouse feed:
 * - Screen Wake Lock acquisition
 *
 * Video visibility pause/resume lives in VideoEngine (CB48), preserving
 * mounted ownership and deliberate pause intent. Wake lock stays here.
 */
export function useClubhouseLifecycle(
  _getStore?: () => { userPaused: boolean }
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

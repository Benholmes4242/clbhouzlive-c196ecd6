/**
 * useVideoWakeLock — CB49. The ONE screen wake-lock owner for video, mounted
 * at the app root (AppInner), so Clubhouse, Discover, Watch and the
 * fullscreen viewer all behave the same.
 *
 * Driven solely by VideoEngine.isAnyLanePlaying() (silent always-muted
 * previews excluded there). Acquire on false→true; release on true→false
 * after RELEASE_GRACE_MS so loop restarts, role rotations and swipes between
 * videos don't churn the lock. On return to the app (the browser drops wake
 * locks when hidden) re-acquire only if something is playing. Failures
 * (unsupported device, low battery) stay silent.
 */
import { useEffect } from 'react';
import { VideoEngine } from '@/video/VideoEngine';

export const RELEASE_GRACE_MS = 2000;

export function useVideoWakeLock(): void {
  useEffect(() => {
    let sentinel: WakeLockSentinel | null = null;
    let requesting = false;
    let held = false; // logical intent: we want the lock
    let graceTimer: ReturnType<typeof setTimeout> | null = null;

    const acquire = async () => {
      if (sentinel || requesting) return;
      try {
        if (!('wakeLock' in navigator)) return;
        requesting = true;
        const s: WakeLockSentinel = await (navigator as any).wakeLock.request('screen');
        requesting = false;
        if (!held) { s.release().catch(() => {}); return; }
        sentinel = s;
        s.addEventListener?.('release', () => { if (sentinel === s) sentinel = null; });
      } catch { requesting = false; /* silent — e.g. low battery */ }
    };
    const release = () => {
      const s = sentinel;
      sentinel = null;
      s?.release().catch(() => {});
    };

    const onChange = () => {
      const playing = VideoEngine.isAnyLanePlaying();
      if (playing) {
        if (graceTimer) { clearTimeout(graceTimer); graceTimer = null; }
        if (!held) { held = true; void acquire(); }
      } else if (held && !graceTimer) {
        graceTimer = setTimeout(() => {
          graceTimer = null;
          if (VideoEngine.isAnyLanePlaying()) return;
          held = false;
          release();
        }, RELEASE_GRACE_MS);
      }
    };
    const onVisibility = () => {
      if (!document.hidden && VideoEngine.isAnyLanePlaying()) {
        held = true;
        void acquire();
      }
    };

    const unsub = VideoEngine.subscribeAnyPlaying(onChange);
    document.addEventListener('visibilitychange', onVisibility);
    onChange();
    return () => {
      unsub();
      document.removeEventListener('visibilitychange', onVisibility);
      if (graceTimer) clearTimeout(graceTimer);
      held = false;
      release();
    };
  }, []);
}

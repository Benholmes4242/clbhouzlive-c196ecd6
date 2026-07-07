/**
 * LockAnchorSync — mounts once at the router level. When the route changes
 * while a body-scroll lock is held (nested overlays, e.g. fullscreen viewer +
 * comments sheet), re-anchors the lock's saved scrollY to the INCOMING route's
 * position so the deferred unlock (on sheet unmount) doesn't drop the incoming
 * page at the source page's offset.
 *
 * Anchor source: ScrollRestoration's per-path map. Present on BACK navigation
 * (restore the source-side offset), absent on forward PUSH (fall back to 0 →
 * profile lands at top, matching PUSH's own scrollTo(0,0)).
 */
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { getBodyScrollLockCount, resyncLockAnchor } from '@/lib/bodyScrollLock';
import { scrollPositions } from '@/components/ScrollRestoration';

export const LockAnchorSync = () => {
  const location = useLocation();
  useEffect(() => {
    if (getBodyScrollLockCount() === 0) return;
    const key = location.pathname + location.search;
    const anchor = scrollPositions.get(key) ?? 0;
    resyncLockAnchor(anchor);
  }, [location]);
  return null;
};

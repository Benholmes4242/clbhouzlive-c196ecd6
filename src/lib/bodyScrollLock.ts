/**
 * Reference-counted body scroll lock. Multiple overlays can request a lock;
 * the body is only released when the LAST one unlocks. Captures the original
 * scroll position + styles once (on first lock) and restores them once (on
 * final unlock), so overlapping overlays can't stomp each other's saved state
 * and leave the body stuck `position: fixed` (which freezes the whole page).
 */
import { scrollPositions } from '@/components/ScrollRestoration';
import { getPageScrollTop, scrollPageTo } from '@/lib/getScrollParent';

let lockCount = 0;
let lockOwnerPath: string | null = null;
let saved: {
  overflow: string;
  position: string;
  top: string;
  left: string;
  right: string;
  width: string;
  scrollY: number;
} | null = null;

export function lockBodyScroll() {
  if (typeof document === 'undefined') return;
  // Hardening (C): if a prior lock exists but the body is NOT fixed (external
  // code cleared styles, or state drifted), re-snapshot from the current
  // scrollY so the final unlock can restore something sensible.
  const bodyIsFixed = document.body.style.position === 'fixed';
  if (lockCount === 0 || !bodyIsFixed) {
    const scrollY = getPageScrollTop();
    saved = {
      overflow: document.body.style.overflow,
      position: document.body.style.position,
      top: document.body.style.top,
      left: document.body.style.left,
      right: document.body.style.right,
      width: document.body.style.width,
      scrollY,
    };
    lockOwnerPath = (typeof window !== 'undefined')
      ? window.location.pathname + window.location.search
      : null;
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollY}px`;
    document.body.style.left = '0';
    document.body.style.right = '0';
    document.body.style.width = '100%';
  }
  lockCount++;
}

/**
 * Re-anchor the saved scrollY that the final unlock will restore.
 * Used on route change while locks are still held (nested lock hosts:
 * fullscreen overlay + comments sheet), so the sheet's deferred unmount
 * unlock doesn't drop the incoming route at the source page's offset.
 * No-op when nothing is locked.
 */
export function resyncLockAnchor(scrollY: number) {
  if (typeof document === 'undefined') return;
  if (lockCount === 0 || !saved) return;
  saved.scrollY = scrollY;
}

/** Number of active locks (0 = body is free). Read-only. */
export function getBodyScrollLockCount() {
  return lockCount;
}

export function unlockBodyScroll() {
  if (typeof document === 'undefined') return;
  if (lockCount === 0) return;
  lockCount--;
  if (lockCount === 0 && saved) {
    const { scrollY } = saved;
    document.body.style.overflow = saved.overflow;
    document.body.style.position = saved.position;
    document.body.style.top = saved.top;
    document.body.style.left = saved.left;
    document.body.style.right = saved.right;
    document.body.style.width = saved.width;
    const currentPath = (typeof window !== 'undefined')
      ? window.location.pathname + window.location.search
      : null;
    const navigatedAway = lockOwnerPath !== null
      && currentPath !== null && currentPath !== lockOwnerPath;
    const target = navigatedAway
      ? (scrollPositions.get(currentPath!) ?? 0)
      : scrollY;
    saved = null;
    lockOwnerPath = null;
    scrollPageTo(target, 'auto');
  }
}

/** Escape hatch: force-release regardless of count (e.g. on route change). */
export function forceUnlockBodyScroll() {
  if (typeof document === 'undefined') return;
  lockCount = 0;
  lockOwnerPath = null;
  if (saved) {
    document.body.style.overflow = saved.overflow;
    document.body.style.position = saved.position;
    document.body.style.top = saved.top;
    document.body.style.left = saved.left;
    document.body.style.right = saved.right;
    document.body.style.width = saved.width;
    saved = null;
  } else {
    document.body.style.overflow = '';
    document.body.style.position = '';
    document.body.style.top = '';
    document.body.style.left = '';
    document.body.style.right = '';
    document.body.style.width = '';
  }
  document.body.classList.remove('lightbox-open');
  document.documentElement.classList.remove('lightbox-open');
}

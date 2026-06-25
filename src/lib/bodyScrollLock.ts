/**
 * Reference-counted body scroll lock. Multiple overlays can request a lock;
 * the body is only released when the LAST one unlocks. Captures the original
 * scroll position + styles once (on first lock) and restores them once (on
 * final unlock), so overlapping overlays can't stomp each other's saved state
 * and leave the body stuck `position: fixed` (which freezes the whole page).
 */
let lockCount = 0;
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
  if (lockCount === 0) {
    const scrollY = window.scrollY;
    saved = {
      overflow: document.body.style.overflow,
      position: document.body.style.position,
      top: document.body.style.top,
      left: document.body.style.left,
      right: document.body.style.right,
      width: document.body.style.width,
      scrollY,
    };
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollY}px`;
    document.body.style.left = '0';
    document.body.style.right = '0';
    document.body.style.width = '100%';
  }
  lockCount++;
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
    saved = null;
    window.scrollTo(0, scrollY);
  }
}

/** Escape hatch: force-release regardless of count (e.g. on route change). */
export function forceUnlockBodyScroll() {
  if (typeof document === 'undefined') return;
  lockCount = 0;
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

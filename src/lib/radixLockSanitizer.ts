/**
 * Radix-lock safety net.
 *
 * Radix `DismissableLayer` / `RemoveScroll` (used by `AlertDialog`, `Dialog`,
 * `DropdownMenu`, `Popover`) manage a module-scoped counter that writes
 * `document.body.style.pointerEvents = 'none'` while any modal layer is open.
 * When a per-item component that hosts one of those layers is *evicted by an
 * ancestor render* (e.g. React Query invalidation removes the row after the
 * mutation resolves), React can commit the unmount cleanups in an order that
 * leaves the counter ≥ 1 with no owner left to decrement — or leaves the
 * inline `pointer-events: none` on `<body>` after all owners are gone.
 *
 * This helper is the belt-and-braces cleanup for that class of race. Call it
 * from a mutation's `onSuccess` *after* invalidations, wrapped in `rAF` so it
 * runs post-commit.
 *
 * It is conditional-safe: it only sanitizes when
 *   1. Our own `bodyScrollLock` counter is zero (no CommentsSheet / drawer
 *      / fullscreen viewer legitimately holds the body).
 *   2. No open Radix dialog / alertdialog is still present in the DOM
 *      (which would legitimately want body pointer-events off).
 *
 * If either condition fails we no-op — a future nested flow that runs a
 * delete *underneath* another modal will not have its lock stomped.
 */
import {
  forceUnlockBodyScroll,
  getBodyScrollLockCount,
} from '@/lib/bodyScrollLock';

/** Any Radix dialog/alertdialog currently in an "open" data-state. */
function anyOpenRadixDialog(): boolean {
  if (typeof document === 'undefined') return false;
  return !!document.querySelector(
    '[role="dialog"][data-state="open"], [role="alertdialog"][data-state="open"]',
  );
}

/**
 * Clear a leaked `pointer-events: none` on `<body>` when — and only when —
 * nothing legitimately owns the body.
 *
 * Assumption at call sites: the invoking flow (business delete, post delete)
 * cannot run beneath another open modal — the confirm dialog is the only
 * modal live during the mutation. If that ever changes, keep this guard.
 */
export function sanitizeRadixBodyLockIfIdle(): void {
  if (typeof document === 'undefined') return;
  if (getBodyScrollLockCount() > 0) return;
  if (anyOpenRadixDialog()) return;

  // Only touch inline style — don't call forceUnlockBodyScroll unless the
  // body is actually stuck. `forceUnlockBodyScroll` resets our own counter
  // to zero, which is fine here because we've already asserted it's zero.
  const bodyStyle = document.body.style;
  const stuck =
    bodyStyle.pointerEvents === 'none' ||
    bodyStyle.position === 'fixed' ||
    document.documentElement.hasAttribute('data-scroll-locked');
  if (!stuck) return;

  bodyStyle.pointerEvents = '';
  forceUnlockBodyScroll();
}

/** rAF-scheduled variant — use after cache invalidations so the sanitizer
 *  runs *after* React has committed the eviction unmount. */
export function scheduleRadixBodyLockSanitize(): void {
  if (typeof window === 'undefined') return;
  window.requestAnimationFrame(() => {
    window.requestAnimationFrame(sanitizeRadixBodyLockIfIdle);
  });
}

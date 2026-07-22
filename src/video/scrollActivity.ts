/**
 * scrollActivity — global scroll-velocity dampener for rail/grid autoplay.
 *
 * When the user is actively flicking through a rail or grid, mounting/loading
 * new <video> elements causes frame drops and pool thrashing (acquire → 200ms
 * later → evict, repeat). This module tracks scroll activity across the
 * document and exposes a "quiescent" signal that rail-lane hooks consult
 * before acquiring a lane.
 *
 * Product spec:
 *   - Rails/grids should NOT autoplay while the user is mid-flick.
 *   - Once the scroll settles (~180 ms without further movement), rails may
 *     acquire lanes normally.
 *   - The Clubhouse SNAP feed is not affected — it swipes one card at a time
 *     and its own IntersectionObserver already gates activation.
 */

import { useSyncExternalStore } from 'react';

const QUIESCENT_MS = 180;

let lastScrollAt = 0;
let quiescent = true;
let timer: ReturnType<typeof setTimeout> | null = null;
const listeners = new Set<() => void>();

// Diagnostic counters — surfaced via PerfHud so we can verify the dampener
// is doing meaningful work in the field.
const stats = {
  deferredAcquires: 0,   // rail-lane acquire skipped because mid-scroll
  releasedAcquires: 0,   // deferred acquire finally fired on settle
  scrollBursts: 0,       // count of quiescent → active transitions
};

function emit() {
  for (const fn of listeners) {
    try { fn(); } catch { /* noop */ }
  }
}

function armSettleTimer() {
  if (timer) clearTimeout(timer);
  timer = setTimeout(() => {
    timer = null;
    if (!quiescent) {
      quiescent = true;
      emit();
    }
  }, QUIESCENT_MS);
}

function noteScroll() {
  lastScrollAt = performance.now();
  if (quiescent) {
    quiescent = false;
    stats.scrollBursts += 1;
    emit();
  }
  armSettleTimer();
}

let bootstrapped = false;
function ensureBootstrapped() {
  if (bootstrapped || typeof window === 'undefined') return;
  bootstrapped = true;
  const opts: AddEventListenerOptions = { capture: true, passive: true };
  // Capture-phase listeners at window level catch every nested scroll
  // container without each rail wiring its own.
  window.addEventListener('scroll', noteScroll, opts);
  window.addEventListener('touchmove', noteScroll, opts);
  window.addEventListener('wheel', noteScroll, opts);
}

export const scrollActivity = {
  isQuiescent(): boolean {
    ensureBootstrapped();
    return quiescent;
  },
  lastScrollAt(): number {
    return lastScrollAt;
  },
  subscribe(fn: () => void): () => void {
    ensureBootstrapped();
    listeners.add(fn);
    return () => { listeners.delete(fn); };
  },
  /** Increment when a rail-lane acquire is deferred by the dampener. */
  noteDeferred(): void { stats.deferredAcquires += 1; },
  /** Increment when a deferred acquire finally fires on settle. */
  noteReleased(): void { stats.releasedAcquires += 1; },
  /** Snapshot for PerfHud. */
  getStats(): { deferredAcquires: number; releasedAcquires: number; scrollBursts: number } {
    return { ...stats };
  },
};

/**
 * React hook — re-renders when the scroll-quiescence state flips.
 * Returns `true` while the page is settled (safe to acquire lanes).
 */
export function useScrollQuiescent(): boolean {
  return useSyncExternalStore(
    scrollActivity.subscribe,
    scrollActivity.isQuiescent,
    () => true,
  );
}

/**
 * fsv2Bridge — decoder-starvation escape hatch (v3).
 *
 * v1: released every engine lane's source on overlay open.
 * v2: added a document-wide sweep of non-fsv2 <video> elements to give
 *     the fullscreen decoder sole tenancy.
 * v3: replaces the mass-restore on close with disciplined lazy restore.
 *     Only elements currently intersecting the viewport are restored
 *     immediately (staggered ~3 per animation frame). Offscreen parked
 *     elements stay parked and are restored on first intersection via a
 *     single shared IntersectionObserver, then unobserved. If a new
 *     fsv2 open lands while restores are pending, the pending restores
 *     are cancelled (they'll re-park anyway) so the singleton's load()
 *     never competes with restore traffic.
 *
 * Traces:
 *   fsv2.bridge.release        { lanesDetached }
 *   fsv2.bridge.sweep          { detached, skipped }
 *   fsv2.bridge.restore
 *   fsv2.bridge.restoreSweep   { restoredNow, deferred }
 *   fsv2.bridge.restoreLazy    { restored }
 *   fsv2.bridge.restoreCancel  { cancelled }
 *
 * Restore never force-plays: it only puts the src back and calls load().
 * Each tile's own visibility logic decides whether to resume.
 */

import { VideoEngine } from '@/video/VideoEngine';
import { useFsv2Store } from '@/features/fsv2/store/fsv2Store';
import { trace } from '@/perf/trace';
import { pushEvent } from '@/features/fsv2/debug/hudBus';

const PARK_ATTR = 'fsv2Parked';
const FSV2_SINGLETON_ATTR = 'data-fsv2-prewarm';

let installed = false;
let prevOpen = false;

// Pending lazy-restore bookkeeping. Elements observed for future
// restore live here so we can cancel on the next fsv2 open.
let lazyObserver: IntersectionObserver | null = null;
const observed = new Set<HTMLVideoElement>();

// A staggered restore queue lets us cap the load()-per-frame rate.
let restoreQueue: HTMLVideoElement[] = [];
let restoreRaf: number | null = null;
const RESTORE_PER_FRAME = 3;

function isFsv2Video(el: HTMLVideoElement): boolean {
  return el.hasAttribute(FSV2_SINGLETON_ATTR);
}

function ensureObserver(): IntersectionObserver | null {
  if (typeof window === 'undefined' || typeof IntersectionObserver === 'undefined') return null;
  if (lazyObserver) return lazyObserver;
  lazyObserver = new IntersectionObserver((entries) => {
    let restored = 0;
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      const el = entry.target as HTMLVideoElement;
      lazyObserver?.unobserve(el);
      observed.delete(el);
      if (restoreOne(el)) restored += 1;
    }
    if (restored > 0) {
      trace('fsv2.bridge.restoreLazy', { restored });
      pushEvent('fsv2.bridge.restoreLazy', { restored });
    }
  }, { rootMargin: '200px 0px' });
  return lazyObserver;
}

function restoreOne(el: HTMLVideoElement): boolean {
  if (!el.isConnected) {
    try { delete el.dataset[PARK_ATTR]; } catch { /* ignore */ }
    return false;
  }
  const src = el.dataset[PARK_ATTR];
  if (!src) return false;
  try {
    el.setAttribute('src', src);
    try { el.load(); } catch { /* ignore */ }
    delete el.dataset[PARK_ATTR];
    return true;
  } catch {
    return false;
  }
}

function scheduleRestoreFlush(): void {
  if (restoreRaf != null) return;
  restoreRaf = requestAnimationFrame(function flush() {
    restoreRaf = null;
    let n = 0;
    while (n < RESTORE_PER_FRAME && restoreQueue.length > 0) {
      const el = restoreQueue.shift() as HTMLVideoElement;
      restoreOne(el);
      n += 1;
    }
    if (restoreQueue.length > 0) {
      restoreRaf = requestAnimationFrame(flush);
    }
  });
}

function isIntersectingViewport(el: HTMLVideoElement): boolean {
  if (!el.isConnected) return false;
  const rect = el.getBoundingClientRect();
  if (rect.width <= 0 || rect.height <= 0) return false;
  const vh = window.innerHeight || 0;
  const vw = window.innerWidth || 0;
  return rect.bottom > 0 && rect.top < vh && rect.right > 0 && rect.left < vw;
}

function sweepDetachNonFsv2Videos(): { detached: number; skipped: number } {
  let detached = 0;
  let skipped = 0;
  const vids = document.getElementsByTagName('video');
  const arr: HTMLVideoElement[] = [];
  for (let i = 0; i < vids.length; i++) arr.push(vids[i] as HTMLVideoElement);
  for (const el of arr) {
    if (isFsv2Video(el)) { skipped += 1; continue; }
    const src = el.getAttribute('src') || '';
    if (!src) { skipped += 1; continue; }
    try {
      el.dataset[PARK_ATTR] = src;
      try { el.pause(); } catch { /* ignore */ }
      el.removeAttribute('src');
      try { el.load(); } catch { /* ignore */ }
      detached += 1;
    } catch {
      skipped += 1;
    }
  }
  return { detached, skipped };
}

/**
 * On close: restore ONLY viewport-intersecting parked elements now
 * (staggered ~3 per animation frame). Everything else is observed and
 * restored lazily on first intersection.
 */
function restoreSweptVideos(): { restoredNow: number; deferred: number } {
  let restoredNow = 0;
  let deferred = 0;
  const nodes = document.querySelectorAll<HTMLVideoElement>('video[data-fsv2-parked]');
  const observer = ensureObserver();
  nodes.forEach((el) => {
    if (!el.isConnected) {
      try { delete el.dataset[PARK_ATTR]; } catch { /* ignore */ }
      return;
    }
    if (isIntersectingViewport(el)) {
      restoreQueue.push(el);
      restoredNow += 1;
    } else if (observer) {
      observer.observe(el);
      observed.add(el);
      deferred += 1;
    } else {
      // No IO available (extremely old browser) — restore anyway.
      restoreQueue.push(el);
      restoredNow += 1;
    }
  });
  if (restoreQueue.length > 0) scheduleRestoreFlush();
  return { restoredNow, deferred };
}

/**
 * Cancel deferred restores. Called at the start of a fresh fsv2 open so
 * the singleton's load() never competes with restore traffic — anything
 * cancelled here will be re-parked by the subsequent sweep anyway.
 */
function cancelPendingRestores(): number {
  let cancelled = 0;
  if (lazyObserver) {
    observed.forEach((el) => {
      try { lazyObserver?.unobserve(el); } catch { /* ignore */ }
      cancelled += 1;
    });
    observed.clear();
  }
  if (restoreQueue.length > 0) {
    cancelled += restoreQueue.length;
    restoreQueue = [];
  }
  if (restoreRaf != null) {
    cancelAnimationFrame(restoreRaf);
    restoreRaf = null;
  }
  return cancelled;
}

/** Count of parked/observed/queued restores still pending. */
export function getPendingRestoreCount(): number {
  return observed.size + restoreQueue.length;
}

function install(): void {
  if (installed) return;
  installed = true;
  prevOpen = useFsv2Store.getState().isOpen;
  useFsv2Store.subscribe((state) => {
    const isOpen = state.isOpen;
    if (isOpen === prevOpen) return;
    prevOpen = isOpen;
    if (isOpen) {
      // Reopen guard: kill any pending restore traffic first.
      const cancelled = cancelPendingRestores();
      if (cancelled > 0) {
        trace('fsv2.bridge.restoreCancel', { cancelled });
        pushEvent('fsv2.bridge.restoreCancel', { cancelled });
      }
      const lanesDetached = VideoEngine.releaseAllForOverlay();
      trace('fsv2.bridge.release', { lanesDetached });
      pushEvent('fsv2.bridge.release', { openId: state.openId, lanesDetached });
      const swept = sweepDetachNonFsv2Videos();
      trace('fsv2.bridge.sweep', swept);
      pushEvent('fsv2.bridge.sweep', { openId: state.openId, ...swept });
    } else {
      VideoEngine.restoreAfterOverlay();
      trace('fsv2.bridge.restore', {});
      pushEvent('fsv2.bridge.restore', {});
      const restoreRes = restoreSweptVideos();
      trace('fsv2.bridge.restoreSweep', restoreRes);
      pushEvent('fsv2.bridge.restoreSweep', restoreRes);
    }
  });
}

install();

/** Idempotent hook so App can guarantee the module is included. */
export function mountFsv2Bridge(): void {
  install();
}

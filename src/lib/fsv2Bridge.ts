/**
 * fsv2Bridge — decoder-starvation escape hatch (v2).
 *
 * v1: released every engine lane's source on overlay open.
 * v2: additionally sweeps the whole document for any <video> that is NOT
 *     the fsv2 singleton and detaches its source, parking the previous
 *     src on the element's dataset so we can restore it on close. Sole
 *     tenancy for the fullscreen decoder is the hard target.
 *
 *   false -> true : releaseAllForOverlay() + sweepDetachNonFsv2Videos()
 *   true  -> false: restoreAfterOverlay() + restoreSweptVideos()
 *
 * Traces:
 *   fsv2.bridge.release       { lanesDetached }
 *   fsv2.bridge.sweep         { detached, skipped }
 *   fsv2.bridge.restore
 *   fsv2.bridge.restoreSweep  { restored, orphaned }
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

function isFsv2Video(el: HTMLVideoElement): boolean {
  return el.hasAttribute(FSV2_SINGLETON_ATTR);
}

function sweepDetachNonFsv2Videos(): { detached: number; skipped: number } {
  let detached = 0;
  let skipped = 0;
  const vids = document.getElementsByTagName('video');
  // Snapshot to array — we may mutate attributes on iterate.
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

function restoreSweptVideos(): { restored: number; orphaned: number } {
  let restored = 0;
  let orphaned = 0;
  // Query any element still tagged. Orphans (unmounted) simply never appear here.
  const nodes = document.querySelectorAll<HTMLVideoElement>('video[data-fsv2-parked]');
  nodes.forEach((el) => {
    const src = el.dataset[PARK_ATTR];
    if (!src) return;
    if (!el.isConnected) { orphaned += 1; delete el.dataset[PARK_ATTR]; return; }
    try {
      el.setAttribute('src', src);
      try { el.load(); } catch { /* ignore */ }
      delete el.dataset[PARK_ATTR];
      restored += 1;
    } catch {
      orphaned += 1;
    }
  });
  return { restored, orphaned };
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

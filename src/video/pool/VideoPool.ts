/**
 * VideoPool — Phase 1 of the video/audio hardening plan.
 *
 * Keeps a small pool of long-lived <video> elements that get reparented
 * between feed slots instead of being unmounted+remounted on every scroll.
 * This is what kills the "black flash on scroll", the poster re-show, and
 * the racing play()→first-frame stall that today's per-card <video>
 * ownership causes.
 *
 * Contract:
 *   - Elements are created once and NEVER destroyed while the app is alive.
 *   - `acquire(slotKey, hlsUrl, posterUrl)` returns a live <video> with the
 *     given source attached. Callers reparent it into their own container
 *     via `container.appendChild(element)`.
 *   - `release(slotKey)` marks the slot idle. The element stays warm in the
 *     pool (HLS instance intact) so a scroll-back is a zero-cost re-acquire.
 *   - LRU eviction happens only when the pool is at capacity and a new
 *     source is requested — the coldest idle element gets its source
 *     swapped or, if origins mismatch, gets its HLS torn down and rebuilt.
 *
 * Feature-flagged: nothing calls into this unless `VITE_VIDEO_POOL === '1'`
 * (see `src/video/pool/flag.ts`). Flag OFF = byte-for-byte legacy path.
 */

import Hls from 'hls.js';
import { logBootEvent } from '@/utils/bootTimeline';
import { videoDebug } from '@/config/videoDebug';
import { registerHlsForDebug, unregisterHlsForDebug } from '@/components/debug/hlsDebugRegistry';

const POOL_SIZE = 3; // prev / current / next

interface PoolEntry {
  id: string;                    // stable "pool-0", "pool-1", ...
  video: HTMLVideoElement;
  hls: Hls | null;               // null on Safari native-HLS path
  currentUrl: string | null;
  slotKey: string | null;        // null when idle
  lastUsed: number;
}

interface PoolStats {
  size: number;
  inUse: number;
  lastAcquireMs: number | null;
}

const originOf = (u: string): string => {
  try { return new URL(u).origin; } catch { return ''; }
};

class VideoPoolImpl {
  private entries: PoolEntry[] = [];
  private initialized = false;

  private ensureInit() {
    if (this.initialized || typeof document === 'undefined') return;
    for (let i = 0; i < POOL_SIZE; i++) {
      const video = document.createElement('video');
      video.playsInline = true;
      video.muted = true;
      video.loop = true;
      video.preload = 'auto';
      video.setAttribute('playsinline', 'true');
      video.setAttribute('webkit-playsinline', 'true');
      video.style.width = '100%';
      video.style.height = '100%';
      video.style.objectFit = 'cover';
      video.style.position = 'absolute';
      video.style.inset = '0';

      this.entries.push({
        id: `pool-${i}`,
        video,
        hls: null,
        currentUrl: null,
        slotKey: null,
        lastUsed: 0,
      });
    }
    this.initialized = true;
    logBootEvent('VIDEO_POOL_INIT', { size: POOL_SIZE });
    videoDebug('pool', 'pool initialized', { size: POOL_SIZE });
  }

  /**
   * Get a warm <video> element pointed at `hlsUrl`. Caller must appendChild
   * the returned element into their container.
   */
  private lastAcquireMs: number | null = null;

  acquire(slotKey: string, hlsUrl: string): HTMLVideoElement {
    this.ensureInit();
    const t0 = performance.now();

    // 1. Same slot already holds an entry — reuse it.
    let entry = this.entries.find(e => e.slotKey === slotKey);
    if (entry) {
      entry.lastUsed = performance.now();
      if (entry.currentUrl !== hlsUrl) {
        this.attachSource(entry, hlsUrl);
      }
      this.lastAcquireMs = +(performance.now() - t0).toFixed(1);
      videoDebug('pool', 'acquire (same-slot reuse)', { slotKey, id: entry.id, ms: this.lastAcquireMs });
      return entry.video;
    }

    // 2. An idle entry already has this URL loaded — warm hit.
    entry = this.entries.find(e => e.slotKey === null && e.currentUrl === hlsUrl);
    if (entry) {
      entry.slotKey = slotKey;
      entry.lastUsed = performance.now();
      this.lastAcquireMs = +(performance.now() - t0).toFixed(1);
      videoDebug('pool', 'acquire (warm hit)', { slotKey, id: entry.id, ms: this.lastAcquireMs });
      return entry.video;
    }

    // 3. Any idle entry — evict its source and load ours.
    entry = this.entries.find(e => e.slotKey === null);
    if (!entry) {
      // 4. Fully saturated — LRU steal from oldest slot.
      entry = [...this.entries].sort((a, b) => a.lastUsed - b.lastUsed)[0];
      videoDebug('pool', 'acquire (LRU evict)', { slotKey, evicted: entry.slotKey, id: entry.id });
    }

    entry.slotKey = slotKey;
    entry.lastUsed = performance.now();
    this.attachSource(entry, hlsUrl);
    this.lastAcquireMs = +(performance.now() - t0).toFixed(1);
    videoDebug('pool', 'acquire (cold)', { slotKey, id: entry.id, ms: this.lastAcquireMs });
    return entry.video;
  }

  release(slotKey: string) {
    const entry = this.entries.find(e => e.slotKey === slotKey);
    if (!entry) return;
    entry.slotKey = null;
    // Keep HLS attached — a scroll-back should be zero-cost.
    try { entry.video.pause(); } catch { /* ignore */ }
    videoDebug('pool', 'release', { slotKey, id: entry.id });
  }

  private attachSource(entry: PoolEntry, hlsUrl: string) {
    const prevUrl = entry.currentUrl;
    const sameOrigin = prevUrl && originOf(prevUrl) === originOf(hlsUrl);

    // Native HLS (Safari) — just set src.
    if (!Hls.isSupported()) {
      if (entry.hls) {
        try { entry.hls.destroy(); } catch { /* ignore */ }
        unregisterHlsForDebug(entry.id);
        entry.hls = null;
      }
      entry.video.src = hlsUrl;
      entry.currentUrl = hlsUrl;
      return;
    }

    // hls.js path — try to reuse the instance across same-origin swaps.
    if (entry.hls && sameOrigin) {
      try {
        entry.hls.loadSource(hlsUrl);
        entry.currentUrl = hlsUrl;
        videoDebug('pool', 'hls loadSource swap', { id: entry.id });
        return;
      } catch (err) {
        videoDebug('pool', 'hls loadSource failed → rebuild', { id: entry.id, err: String(err) });
      }
    }

    // Rebuild HLS.
    if (entry.hls) {
      try { entry.hls.destroy(); } catch { /* ignore */ }
      unregisterHlsForDebug(entry.id);
      entry.hls = null;
    }
    const hls = new Hls({ enableWorker: true, lowLatencyMode: false });
    hls.loadSource(hlsUrl);
    hls.attachMedia(entry.video);
    entry.hls = hls;
    entry.currentUrl = hlsUrl;
    registerHlsForDebug(entry.id, hls, entry.video);
    videoDebug('pool', 'hls attached (fresh)', { id: entry.id });
  }

  getStats(): PoolStats {
    return {
      size: this.entries.length,
      inUse: this.entries.filter(e => e.slotKey !== null).length,
      lastAcquireMs: this.lastAcquireMs,
    };
  }
}

export const VideoPool = new VideoPoolImpl();

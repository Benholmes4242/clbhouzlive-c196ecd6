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
 * Always-on: the pool is the canonical playback path across feed, profile,
 * and fullscreen surfaces.
 */

import Hls, { type HlsConfig } from 'hls.js';
import { logBootEvent } from '@/utils/bootTimeline';
import { videoDebug } from '@/config/videoDebug';
import { registerHlsForDebug, unregisterHlsForDebug } from '@/components/debug/hlsDebugRegistry';
import { HLS_CONFIG } from '@/video/lanePolicy';
import { emitVideoTelemetry } from '@/video/telemetry';
import { readSeededBandwidth } from '@/video/bandwidthMemory';
import { applyStartLevel, bandwidthSeed, viewportPixelHeight } from '@/video/startLevel';


const POOL_SIZE = 3; // prev / current / next

/**
 * Surface hint — tunes HLS buffer / ABR budget per rendering context.
 *  - `inline`     : feed/profile tiles. Small buffers, mobile-safe ABR seed.
 *  - `fullscreen` : immersive viewer. Larger buffer for smoother seeking.
 */
export type PoolSurface = 'inline' | 'fullscreen';

const INLINE_HLS_CONFIG: Partial<HlsConfig> = {
  ...HLS_CONFIG,
  maxBufferLength: 12,
  maxMaxBufferLength: 24,
  backBufferLength: 15,
  maxBufferSize: 20 * 1024 * 1024,
  // Seeded per-instance from bandwidth memory in `attachSource`; this is only
  // the floor used when we have never measured this device's connection.
  abrEwmaDefaultEstimate: 2_500_000,
};

const FULLSCREEN_HLS_CONFIG: Partial<HlsConfig> = {
  ...HLS_CONFIG,
  maxBufferLength: 30,
  maxMaxBufferLength: 60,
  backBufferLength: 30,
  maxBufferSize: 40 * 1024 * 1024,
  abrEwmaDefaultEstimate: 3_500_000,
};

const configFor = (surface: PoolSurface): Partial<HlsConfig> => ({
  ...(surface === 'fullscreen' ? FULLSCREEN_HLS_CONFIG : INLINE_HLS_CONFIG),
  // Real measurement wins over the static floor above.
  abrEwmaDefaultEstimate: bandwidthSeed(readSeededBandwidth()),
});


interface PoolEntry {
  id: string;                    // stable "pool-0", "pool-1", ...
  video: HTMLVideoElement;
  hls: Hls | null;               // null on Safari native-HLS path
  currentUrl: string | null;
  currentSurface: PoolSurface | null;
  slotKey: string | null;        // null when idle
  lastUsed: number;
  acquiredAt: number;            // for first-frame telemetry
  ttffReported: boolean;
  stallHandlerBound: boolean;
}

const originOf = (u: string): string => {
  try { return new URL(u).origin; } catch { return ''; }
};

class VideoPoolImpl {
  private entries: PoolEntry[] = [];
  private initialized = false;
  private activePrewarms = 0;
  private static readonly PREWARM_BUDGET = 2;

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

      const entry: PoolEntry = {
        id: `pool-${i}`,
        video,
        hls: null,
        currentUrl: null,
        currentSurface: null,
        slotKey: null,
        lastUsed: 0,
        acquiredAt: 0,
        ttffReported: false,
        stallHandlerBound: false,
      };
      this.bindMediaTelemetry(entry);
      this.entries.push(entry);
    }
    this.initialized = true;
    logBootEvent('VIDEO_POOL_INIT', { size: POOL_SIZE });
    videoDebug('pool', 'pool initialized', { size: POOL_SIZE });
  }

  private bindMediaTelemetry(entry: PoolEntry) {
    if (entry.stallHandlerBound) return;
    const onLoaded = () => {
      if (entry.ttffReported || !entry.acquiredAt) return;
      entry.ttffReported = true;
      const ms = Math.round(performance.now() - entry.acquiredAt);
      emitVideoTelemetry('video.first_frame_ms', { ms, id: entry.id });
    };
    const onWaiting = () => {
      emitVideoTelemetry('video.stall', { id: entry.id, t: entry.video.currentTime });
    };
    entry.video.addEventListener('loadeddata', onLoaded);
    entry.video.addEventListener('waiting', onWaiting);
    entry.stallHandlerBound = true;
  }

  /**
   * Get a warm <video> element pointed at `hlsUrl`. Caller must appendChild
   * the returned element into their container.
   */
  acquire(slotKey: string, hlsUrl: string, surface: PoolSurface = 'inline'): HTMLVideoElement {
    this.ensureInit();
    const t0 = performance.now();

    // 1. Same slot already holds an entry — reuse it.
    let entry = this.entries.find(e => e.slotKey === slotKey);
    if (entry) {
      entry.lastUsed = performance.now();
      if (entry.currentUrl !== hlsUrl || entry.currentSurface !== surface) {
        entry.acquiredAt = performance.now();
        entry.ttffReported = false;
        this.attachSource(entry, hlsUrl, surface);
      }
      videoDebug('pool', 'acquire (same-slot reuse)', { slotKey, id: entry.id, ms: +(performance.now() - t0).toFixed(1) });
      return entry.video;
    }

    // 2. An idle entry already has this URL loaded — warm hit.
    entry = this.entries.find(e => e.slotKey === null && e.currentUrl === hlsUrl);
    if (entry) {
      entry.slotKey = slotKey;
      entry.lastUsed = performance.now();
      // If surface changed (inline→fullscreen), reconfigure but keep buffer.
      if (entry.currentSurface !== surface) {
        this.reconfigureLevels(entry, surface);
        entry.currentSurface = surface;
      }
      videoDebug('pool', 'acquire (warm hit)', { slotKey, id: entry.id, ms: +(performance.now() - t0).toFixed(1) });
      return entry.video;
    }

    // 3. Any idle entry — evict its source and load ours.
    entry = this.entries.find(e => e.slotKey === null);
    if (!entry) {
      // 4. Fully saturated — LRU steal from oldest slot.
      entry = [...this.entries].sort((a, b) => a.lastUsed - b.lastUsed)[0];
      emitVideoTelemetry('video.pool_evict', { evicted: entry.slotKey, id: entry.id });
      videoDebug('pool', 'acquire (LRU evict)', { slotKey, evicted: entry.slotKey, id: entry.id });
    }

    entry.slotKey = slotKey;
    entry.lastUsed = performance.now();
    entry.acquiredAt = performance.now();
    entry.ttffReported = false;
    this.attachSource(entry, hlsUrl, surface);
    videoDebug('pool', 'acquire (cold)', { slotKey, id: entry.id, ms: +(performance.now() - t0).toFixed(1) });
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

  /**
   * Pre-warm an idle pool entry with a manifest so a subsequent acquire is
   * a warm hit. No-op if all entries are in use, if the URL is already
   * loaded anywhere, or if concurrent prewarms exceed budget.
   */
  prewarm(hlsUrl: string, surface: PoolSurface = 'inline') {
    this.ensureInit();
    if (!hlsUrl) return;
    if (this.activePrewarms >= VideoPoolImpl.PREWARM_BUDGET) return;
    // Already loaded somewhere — nothing to do.
    if (this.entries.some(e => e.currentUrl === hlsUrl)) return;
    // Need an idle entry that isn't the LRU-hottest one (leave headroom).
    const idle = this.entries.filter(e => e.slotKey === null)
      .sort((a, b) => a.lastUsed - b.lastUsed);
    const entry = idle[0];
    if (!entry) return;
    this.activePrewarms += 1;
    try {
      this.attachSource(entry, hlsUrl, surface);
      emitVideoTelemetry('video.pool_prewarm', { id: entry.id });
      videoDebug('pool', 'prewarm', { id: entry.id, url: hlsUrl });
    } finally {
      // Decrement on next tick — attachSource is sync but network is async.
      setTimeout(() => { this.activePrewarms = Math.max(0, this.activePrewarms - 1); }, 500);
    }
  }

  private reconfigureLevels(entry: PoolEntry, surface: PoolSurface) {
    if (!entry.hls) return;
    // Cheap surface-aware tweak that doesn't require reattach.
    try {
      const cfg = configFor(surface);
      // Only mutate runtime-safe fields.
      if (typeof cfg.maxBufferLength === 'number') {
        (entry.hls.config as HlsConfig).maxBufferLength = cfg.maxBufferLength;
      }
      if (typeof cfg.maxMaxBufferLength === 'number') {
        (entry.hls.config as HlsConfig).maxMaxBufferLength = cfg.maxMaxBufferLength;
      }
    } catch { /* ignore */ }
  }

  private attachSource(entry: PoolEntry, hlsUrl: string, surface: PoolSurface) {
    const prevUrl = entry.currentUrl;
    const sameOrigin = prevUrl && originOf(prevUrl) === originOf(hlsUrl);
    entry.currentSurface = surface;

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

    // hls.js path — reuse the instance across same-origin swaps.
    // Do NOT re-attachMedia; loadSource on an attached instance is enough.
    if (entry.hls && sameOrigin) {
      try {
        this.reconfigureLevels(entry, surface);
        entry.hls.loadSource(hlsUrl);
        entry.currentUrl = hlsUrl;
        videoDebug('pool', 'hls loadSource swap', { id: entry.id, surface });
        return;
      } catch (err) {
        videoDebug('pool', 'hls loadSource failed → rebuild', { id: entry.id, err: String(err) });
      }
    }

    // Rebuild HLS with surface-tuned config.
    if (entry.hls) {
      try { entry.hls.destroy(); } catch { /* ignore */ }
      unregisterHlsForDebug(entry.id);
      entry.hls = null;
    }
    const hls = new Hls(configFor(surface));
    hls.on(Hls.Events.LEVEL_SWITCHED, (_evt, data) => {
      emitVideoTelemetry('video.abr_switch', { id: entry.id, level: data?.level });
    });
    // CRISP FIRST FRAME: pick the opening rung from surface size + known
    // bandwidth. Without this hls.js opens on the ladder's 240p rung and
    // needs several 4s segments to climb — the "blurry for 3-4s" bug.
    hls.on(Hls.Events.MANIFEST_PARSED, () => {
      const minHeight = (entry.currentSurface ?? surface) === 'fullscreen' ? 720 : 540;
      const level = applyStartLevel(
        hls as any,
        viewportPixelHeight(),
        readSeededBandwidth(),
        minHeight,
      );
      videoDebug('pool', 'startLevel applied', { id: entry.id, level });
    });
    hls.loadSource(hlsUrl);

    hls.attachMedia(entry.video);
    entry.hls = hls;
    entry.currentUrl = hlsUrl;
    registerHlsForDebug(entry.id, hls, entry.video);
    videoDebug('pool', 'hls attached (fresh)', { id: entry.id, surface });
  }

  getStats() {
    return {
      size: this.entries.length,
      inUse: this.entries.filter(e => e.slotKey !== null).length,
      warmUrls: this.entries.filter(e => e.currentUrl !== null).length,
    };
  }
}

export const VideoPool = new VideoPoolImpl();


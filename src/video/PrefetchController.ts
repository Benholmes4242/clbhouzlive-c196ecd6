/**
 * PrefetchController — scroll-velocity-predicted HLS cache warming.
 *
 * Fills the browser HTTP cache with the HLS manifest + first lowest-rung
 * media segment for VIDEO cards about to enter the activation zone. hls.js
 * later hits browser cache on `loadSource` → cold-class becomes warm-class.
 *
 * Explicitly NOT a lane: no <video> element, no hls.js instance, no lifecycle
 * hooks. Pure fetch() into the HTTP cache. Does not compete with active
 * playback (see gating below).
 *
 * Runs in production. Only its `[VPERF] prefetch.*` logging is gated by
 * `isPerfEnabled()`; the mechanism itself is unconditional so users benefit
 * regardless of the DBG pill.
 *
 * Discipline (all four are hard rules — brief:2a):
 *   1. Max 2 in-flight (FIFO drop of the older on overflow).
 *   2. AbortController on direction reversal or the card being passed.
 *   3. LRU set of already-warmed ownerKeys (cap 20, session only).
 *   4. HARD SKIPS: navigator.connection.saveData || effectiveType in
 *      {slow-2g, 2g}; skip entirely while any lane is buffering.
 */

import { VideoEngine } from './VideoEngine';
import { vperfPrefetchTally } from '@/perf/vperf';
import { isPerfEnabled } from '@/perf/navTiming';

const MAX_INFLIGHT = 2;
const LRU_CAP = 20;
const ARRIVAL_HORIZON_MS = 1500;

interface Inflight {
  ownerKey: string;
  ctrl: AbortController;
}

function log(kind: 'issued' | 'aborted', payload: Record<string, unknown>): void {
  if (!isPerfEnabled()) return;
  // eslint-disable-next-line no-console
  console.info(`[VPERF] prefetch.${kind}`, payload);
}

class PrefetchControllerImpl {
  private inflight: Inflight[] = [];
  private warmed = new Set<string>();
  private warmedOrder: string[] = [];

  /** True when the current network / engine state forbids prefetch.
   *  `allowWhileLoading` lets same-card horizontal (carousel) warms bypass
   *  the laneLoading gate — they don't compete with cross-post prediction
   *  the way a far cold fetch would. saveData / slow-net skips still apply. */
  private shouldSkip(allowWhileLoading = false): { skip: true; reason: string } | { skip: false } {
    if (typeof navigator !== 'undefined') {
      const conn = (navigator as any).connection;
      if (conn?.saveData === true) return { skip: true, reason: 'saveData' };
      const t = conn?.effectiveType as string | undefined;
      if (t === 'slow-2g' || t === '2g') return { skip: true, reason: 'slowNet' };
    }
    if (!allowWhileLoading && VideoEngine.isAnyLaneLoading()) {
      return { skip: true, reason: 'laneLoading' };
    }
    return { skip: false };
  }

  /** Mark this ownerKey as already warmed (LRU eviction). */
  private markWarmed(ownerKey: string): void {
    if (this.warmed.has(ownerKey)) return;
    this.warmed.add(ownerKey);
    this.warmedOrder.push(ownerKey);
    while (this.warmedOrder.length > LRU_CAP) {
      const evicted = this.warmedOrder.shift();
      if (evicted) this.warmed.delete(evicted);
    }
  }

  /** True iff `ownerKey` was ever warmed in this session. Used by activation
   *  emitters to tag `prefetched: true` on the feed.activate line. */
  wasPrefetched(ownerKey: string): boolean {
    return this.warmed.has(ownerKey);
  }

  /** Cancel the in-flight prefetch for `ownerKey` if any. */
  abort(ownerKey: string, reason: string): void {
    const idx = this.inflight.findIndex(i => i.ownerKey === ownerKey);
    if (idx < 0) return;
    const [dropped] = this.inflight.splice(idx, 1);
    try { dropped.ctrl.abort(); } catch {}
    log('aborted', { ownerKey, reason });
    vperfPrefetchTally('aborted', reason);
  }

  /** Cancel every in-flight prefetch (direction reversal). */
  abortAll(reason: string): void {
    const list = this.inflight.slice();
    this.inflight = [];
    for (const i of list) {
      try { i.ctrl.abort(); } catch {}
      log('aborted', { ownerKey: i.ownerKey, reason });
      vperfPrefetchTally('aborted', reason);
    }
  }

  /**
   * Request a cache-warm for `ownerKey` (HLS manifest + first segment of the
   * lowest rung). Idempotent: no-op if already warmed or in-flight. Silently
   * skipped when discipline rules forbid it.
   *
   * `opts.allowWhileLoading` — bypass the "any lane loading" skip. Used by
   * the carousel adjacent-slide warm path (same card, low cost, must fire
   * even while the active slide's HLS is loading). saveData/slow-net still
   * skip.
   */
  request(ownerKey: string, hlsUrl: string, opts?: { allowWhileLoading?: boolean }): void {
    if (!ownerKey || !hlsUrl) return;
    if (this.warmed.has(ownerKey)) return;
    if (this.inflight.some(i => i.ownerKey === ownerKey)) return;

    const skip = this.shouldSkip(opts?.allowWhileLoading === true);
    if (skip.skip) {
      log('aborted', { ownerKey, reason: skip.reason });
      vperfPrefetchTally('aborted', skip.reason);
      return;
    }

    // FIFO drop: hold at most MAX_INFLIGHT — older prefetches lose priority
    // as newer cards enter the arrival horizon.
    while (this.inflight.length >= MAX_INFLIGHT) {
      const oldest = this.inflight.shift();
      if (!oldest) break;
      try { oldest.ctrl.abort(); } catch {}
      log('aborted', { ownerKey: oldest.ownerKey, reason: 'inflightCap' });
      vperfPrefetchTally('aborted', 'inflightCap');
    }

    const ctrl = new AbortController();
    const rec: Inflight = { ownerKey, ctrl };
    this.inflight.push(rec);
    log('issued', { ownerKey });
    vperfPrefetchTally('issued');

    void this.runPrefetch(hlsUrl, ctrl.signal)
      .then(() => {
        this.markWarmed(ownerKey);
      })
      .catch((err) => {
        if ((err as any)?.name === 'AbortError') return;
        // Log network failures once (already tallied on abort paths). Silent
        // is fine — hls.js will fetch normally on activation.
      })
      .finally(() => {
        const i = this.inflight.findIndex(x => x.ownerKey === ownerKey);
        if (i >= 0) this.inflight.splice(i, 1);
      });
  }

  private async runPrefetch(hlsUrl: string, signal: AbortSignal): Promise<void> {
    const manifestRes = await fetch(hlsUrl, { signal, credentials: 'omit', mode: 'cors' });
    if (!manifestRes.ok) throw new Error(`manifest ${manifestRes.status}`);
    const manifestText = await manifestRes.text();

    // Master → pick the lowest-rung variant playlist.
    const variantUrl = pickLowestRungVariant(manifestText, hlsUrl);
    let mediaPlaylistText = manifestText;
    let mediaPlaylistUrl = hlsUrl;
    if (variantUrl) {
      const vRes = await fetch(variantUrl, { signal, credentials: 'omit', mode: 'cors' });
      if (!vRes.ok) throw new Error(`variant ${vRes.status}`);
      mediaPlaylistText = await vRes.text();
      mediaPlaylistUrl = variantUrl;
    }
    const firstSeg = pickFirstSegment(mediaPlaylistText, mediaPlaylistUrl);
    if (!firstSeg) return;
    const segRes = await fetch(firstSeg, { signal, credentials: 'omit', mode: 'cors' });
    if (!segRes.ok) throw new Error(`segment ${segRes.status}`);
    // Consume body so the browser actually commits the response to cache.
    await segRes.arrayBuffer();
  }
}

/** Parse an HLS master playlist and return the URL of the lowest-BANDWIDTH
 *  variant (i.e. lowest rung). Returns null if this is already a media
 *  playlist (no #EXT-X-STREAM-INF lines). */
function pickLowestRungVariant(text: string, baseUrl: string): string | null {
  const lines = text.split(/\r?\n/);
  let bestBw = Infinity;
  let bestUri: string | null = null;
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    if (!l.startsWith('#EXT-X-STREAM-INF')) continue;
    const bwMatch = /BANDWIDTH=(\d+)/.exec(l);
    const bw = bwMatch ? Number(bwMatch[1]) : NaN;
    const uriLine = (lines[i + 1] || '').trim();
    if (!uriLine || uriLine.startsWith('#')) continue;
    if (isFinite(bw) && bw < bestBw) {
      bestBw = bw;
      bestUri = uriLine;
    }
  }
  return bestUri ? resolveUrl(bestUri, baseUrl) : null;
}

/** Parse an HLS media playlist and return the absolute URL of the first
 *  media segment (first non-comment, non-blank line following #EXTINF). */
function pickFirstSegment(text: string, baseUrl: string): string | null {
  const lines = text.split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    if (!l.startsWith('#EXTINF')) continue;
    // find next non-blank non-comment line
    for (let j = i + 1; j < lines.length; j++) {
      const t = lines[j].trim();
      if (!t || t.startsWith('#')) continue;
      return resolveUrl(t, baseUrl);
    }
  }
  return null;
}

function resolveUrl(uri: string, base: string): string {
  try {
    return new URL(uri, base).toString();
  } catch {
    return uri;
  }
}

export const PrefetchController = new PrefetchControllerImpl();

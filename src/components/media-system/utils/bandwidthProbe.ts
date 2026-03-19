/**
 * bandwidthProbe — pre-measures real network bandwidth before any video loads.
 * Runs once on app open in parallel with feed data fetching.
 * Saves result via saveSharedBandwidth so every HLS.js instance in the session
 * starts with real bandwidth data — including the very first video.
 *
 * Uses a small known-size image from Cloudflare R2 (same CDN as videos).
 * Target probe size: ~60KB — large enough for accurate measurement, small enough
 * to complete in <300ms on good connections.
 */

import { saveSharedBandwidth, getSharedBandwidth } from './sharedBandwidth';
import { devLog } from '@/components/debug/ConsoleLogCapture';

// A small thumbnail image hosted on Cloudflare R2 — same CDN as all videos.
// This URL must be a publicly accessible image that is always available.
// Use a course thumbnail or avatar that is guaranteed to exist.
const PROBE_URL = 'https://media.clbhouz.co.uk/probe/bw-probe.jpg';
const PROBE_FALLBACK_URL = 'https://customer-4ah4gni80ytefpck.cloudflarestream.com/favicon.ico';

const PROBE_TIMEOUT_MS = 4000; // Give up after 4 seconds
const MIN_PROBE_BYTES = 10_000; // Ignore probes smaller than 10KB (inaccurate)

let _probeRan = false;
let _probeRunning = false;

/**
 * Run the bandwidth probe. Safe to call multiple times — only runs once per session.
 * Fire-and-forget: does not throw, does not block.
 */
export async function runBandwidthProbe(): Promise<void> {
  // Skip if already ran or running this session
  if (_probeRan || _probeRunning) return;

  // Skip if we already have a good measurement from earlier in session
  if (getSharedBandwidth() > 2_000_000) {
    _probeRan = true;
    return;
  }

  _probeRunning = true;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), PROBE_TIMEOUT_MS);

    const startTime = performance.now();

    // Fetch with cache-busting to ensure real network hit
    const response = await fetch(
      `${PROBE_URL}?_t=${Date.now()}`,
      {
        signal: controller.signal,
        cache: 'no-store',
        method: 'GET',
      }
    );

    if (!response.ok) throw new Error(`Probe fetch failed: ${response.status}`);

    const buffer = await response.arrayBuffer();
    clearTimeout(timeout);

    const endTime = performance.now();
    const durationMs = endTime - startTime;
    const bytes = buffer.byteLength;

    if (bytes < MIN_PROBE_BYTES || durationMs <= 0) {
      throw new Error(`Probe too small or too fast: ${bytes}b in ${durationMs}ms`);
    }

    // Convert to bits per second
    const bitsPerSecond = (bytes * 8) / (durationMs / 1000);

    // Apply a conservative factor — probe conditions may differ from streaming
    // 0.8 = use 80% of measured bandwidth to account for TCP slow start differences
    const conservativeBps = Math.round(bitsPerSecond * 0.8);

    saveSharedBandwidth(conservativeBps);

    // Probe result logged silently — enable clbhouz-video-debug for visibility

  } catch (err) {
    // Probe failed — try fallback URL silently
    try {
      const start = performance.now();
      const res = await fetch(`${PROBE_FALLBACK_URL}?_t=${Date.now()}`, {
        cache: 'no-store',
        method: 'GET',
      });
      if (res.ok) {
        const buf = await res.arrayBuffer();
        const dur = performance.now() - start;
        if (buf.byteLength > 100 && dur > 0) {
          const bps = Math.round((buf.byteLength * 8) / (dur / 1000) * 0.8);
          saveSharedBandwidth(bps);
        }
      }
    } catch {
      // Fallback also failed — silently continue, videos will self-measure
    }
  } finally {
    _probeRan = true;
    _probeRunning = false;
  }
}

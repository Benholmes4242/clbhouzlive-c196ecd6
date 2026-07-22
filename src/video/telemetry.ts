/**
 * Video telemetry — Phase 4.
 *
 * Lightweight, sampled event emitter for the video/audio pipeline.
 * Events fan out to:
 *   - the existing analytics pipeline (window.__analytics if present)
 *   - a dev in-memory ring buffer surfaced by PerfHud
 *
 * Sampling: 100% in dev, 10% in prod.
 */

export type VideoTelemetryEvent =
  | 'video.stall'
  | 'video.first_frame_ms'
  | 'video.audio_denied'
  | 'video.pool_evict'
  | 'video.pool_prewarm'
  | 'video.abr_switch';

export interface VideoTelemetryRecord {
  t: number;
  event: VideoTelemetryEvent;
  data?: Record<string, unknown>;
}

const RING_MAX = 100;
const ring: VideoTelemetryRecord[] = [];

const isDev = (() => {
  try { return import.meta.env?.DEV === true; } catch { return false; }
})();

const SAMPLE_RATE = isDev ? 1 : 0.1;

// Aggregates (always tracked, unsampled — cheap counters).
const counters: Record<string, number> = {};
let firstFrameSum = 0;
let firstFrameCount = 0;

export function emitVideoTelemetry(event: VideoTelemetryEvent, data?: Record<string, unknown>) {
  counters[event] = (counters[event] ?? 0) + 1;
  if (event === 'video.first_frame_ms' && typeof data?.ms === 'number') {
    firstFrameSum += data.ms;
    firstFrameCount += 1;
  }

  if (Math.random() > SAMPLE_RATE) return;

  const record: VideoTelemetryRecord = { t: Date.now(), event, data };
  ring.push(record);
  if (ring.length > RING_MAX) ring.shift();

  try {
    const w = window as unknown as { __analytics?: { track?: (name: string, props?: unknown) => void } };
    w.__analytics?.track?.(event, data);
  } catch {
    /* analytics not present — no-op */
  }
}

export function getVideoTelemetryStats() {
  return {
    counters: { ...counters },
    avgFirstFrameMs: firstFrameCount ? Math.round(firstFrameSum / firstFrameCount) : 0,
    firstFrameCount,
    recent: ring.slice(-10),
  };
}

export function drainVideoTelemetry(): VideoTelemetryRecord[] {
  return ring.splice(0, ring.length);
}

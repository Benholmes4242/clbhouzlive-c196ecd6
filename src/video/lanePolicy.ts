/**
 * VideoEngine — Stage 0 lane policy (gates centralised here).
 *
 * Everything the engine needs to decide "can I load / play / unmute right
 * now?" lives here so the engine stays dumb. No React, no DOM.
 */

export type LaneId = 'feed-active' | 'feed-next' | 'feed-prev' | 'fullscreen';

export const DEFAULT_LANE_IDS: LaneId[] = [
  'feed-active',
  'feed-next',
  'feed-prev',
  'fullscreen',
];

/** Max concurrent lanes actively loading a manifest. */
export const MAX_CONCURRENT_LOADS = 2;

/** ABR ceiling (kbps) applied to every lane. */
export const ABR_MAX_KBPS = 5000;

/** Only one lane may be unmuted at any time. */
export const ONE_UNMUTED_LANE = true;

/** Pause every lane on tab hidden. */
export const PAUSE_ON_HIDDEN = true;

/**
 * Save-data / 2g gate. When true the engine refuses to auto-load and only
 * loads on explicit user intent. Read once at boot (users don't toggle
 * connections mid-session).
 */
export function shouldGateForSaveData(): boolean {
  if (typeof navigator === 'undefined') return false;
  const conn = (navigator as any).connection;
  if (!conn) return false;
  if (conn.saveData === true) return true;
  const t = conn.effectiveType as string | undefined;
  return t === 'slow-2g' || t === '2g';
}

export const HLS_CONFIG = {
  // Startup: let the engine seek to startPosition on manifest-parsed.
  startPosition: -1,
  // Small back buffer keeps memory in check across 4 lanes.
  backBufferLength: 30,
  // Modest forward buffer — enough for a snappy seek, not enough to hog data.
  maxBufferLength: 20,
  maxMaxBufferLength: 40,
  maxBufferSize: 30 * 1024 * 1024,
  // ABR cap enforced via config; hls.js reads bitrates in bps.
  capLevelToPlayerSize: true,
  // Don't let hls thrash when tabs backgrounded.
  enableWorker: true,
  lowLatencyMode: false,
} as const;

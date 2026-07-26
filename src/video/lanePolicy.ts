/**
 * VideoEngine — Stage 0 lane policy (gates centralised here).
 *
 * Everything the engine needs to decide "can I load / play / unmute right
 * now?" lives here so the engine stays dumb. No React, no DOM.
 */

export type LaneId =
  | 'feed-active'
  | 'feed-next'
  | 'feed-prev'
  | 'fullscreen'
  | 'rail-0'
  | 'rail-1'
  | 'rail-2';

export const DEFAULT_LANE_IDS: LaneId[] = [
  'feed-active',
  'feed-next',
  'feed-prev',
  'fullscreen',
  'rail-0',
  'rail-1',
  'rail-2',
];

/** Budgeted rail-lane pool size (decoder ceiling — NOT one lane per rail). */
export const RAIL_LANE_BUDGET = 3;
export const RAIL_LANE_IDS: LaneId[] = ['rail-0', 'rail-1', 'rail-2'];

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
  // NOTE: capLevelToPlayerSize is applied per-lane in VideoEngine (rails only).
  // Feed-active + fullscreen lanes render at viewport size; capping there
  // would only cost quality. Rails render in small tiles — worth the cap.
  // Don't let hls thrash when tabs backgrounded.
  enableWorker: true,
  lowLatencyMode: false,
  // CRISP FIRST FRAME: hls.js's built-in "bandwidth test" loads the first
  // fragment at the LOWEST rung to measure throughput. With 4s segments that
  // means several seconds of visibly blurry video on every open. We seed ABR
  // from bandwidth memory and pick the opening rung ourselves instead.
  testBandwidth: false,
  // Fetch the first fragment while the level playlist is still being parsed.
  startFragPrefetch: true,
  // Don't sit on a stalled fragment for 4s before switching down.
  maxStarvationDelay: 2,
  maxLoadingDelay: 2,
  fragLoadingMaxRetry: 4,
  manifestLoadingMaxRetry: 3,
} as const;

/** Rail-only overrides applied on top of HLS_CONFIG for lanes with id
 *  prefix `rail-`. Keeps cold-start segment fetch small (lowest rung) and
 *  caps subsequent levels to the tile's rendered size — the Instagram-grid
 *  approach; capLevelToPlayerSize auto-upshifts on element grow, so borrowed
 *  rail lanes re-parented into fullscreen scale up naturally. */
export const RAIL_HLS_OVERRIDES = {
  capLevelToPlayerSize: true,
} as const;

